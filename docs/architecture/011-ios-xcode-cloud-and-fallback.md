# 011: iOS Xcode Cloud Build And Fallback

## Status

Accepted

## Context

The mobile app uses Expo in a monorepo, but the native `ios/` project remains generated-only and is intentionally not committed.

We want:

- GitHub Actions to remain the orchestration layer for CI
- repository visibility to decide which iOS path runs first
- a backup GitHub path when Xcode Cloud cannot start a build because of compute-hour or start-build limits
- explicit human approval before any path is used

The repo uses a reusable iOS workflow that triggers Xcode Cloud through the App Store Connect API rather than archiving the app directly on GitHub-hosted runners.

## Decision

### Primary Build Path

The reusable iOS workflow in:

- [`.github/workflows/ios-build.yml`](../../.github/workflows/ios-build.yml)

does the following:

1. resolves repository visibility from GitHub context
2. applies an optional visibility override input when provided
3. selects the primary iOS path from that effective visibility
4. waits on the protected environment for the selected path
5. runs the selected primary path and, if needed, pauses on the second path before fallback
6. records workflow/build metadata in the workflow summary

The path-selection rules are:

- public repositories: `github_actions`
- private repositories: `xcode_cloud`

The Xcode Cloud approval environment is:

- `app-mobile@ios-build-xcode`

The GitHub Actions approval environment is:

- `app-mobile@ios-build-gha`

The workflow also accepts:

- `repository_visibility_override`

with supported values:

- `public`
- `private`

### GitHub Actions Path

GitHub Actions is the primary iOS path for public repositories.

Today that path is still placeholder-only. The workflow treats it as a first-class path for routing and approvals, but it does not yet perform a real iOS archive.

When the GitHub Actions path is selected first, the workflow:

1. pauses on `app-mobile@ios-build-gha`
2. reports that GitHub Actions was selected as the primary path
3. marks the Xcode Cloud path as eligible fallback because the GitHub Actions path is still placeholder-only

### Xcode Cloud Path

Xcode Cloud owns the real Apple-native archive/sign/distribution steps.

The post-clone setup script lives at:

- [`apps/mobile/ios/ci_scripts/ci_post_clone.sh`](../../apps/mobile/ios/ci_scripts/ci_post_clone.sh)

Xcode Cloud resolves the post-clone entrypoint from the iOS project root. That script currently runs:

```sh
export CI=1
bun install --frozen-lockfile
bun run build
node --no-warnings --eval "require('expo/bin/autolinking')" expo-modules-autolinking react-native-config --json --platform ios > /dev/null
bun x expo prebuild -p ios --clean
```

This means:

- monorepo dependencies are installed in the Xcode Cloud environment
- the workspace build runs before native generation
- Expo prebuild generates the iOS project during CI

We rely on Expo prebuild to own native project generation and CocoaPods setup. The script does not run a separate `pod install`.

### Fallback Path

If the active path cannot continue, the workflow can switch to the other path after its own approval gate.

The workflow allows at most one fallback per run:

- public repo: GitHub Actions primary -> Xcode Cloud fallback -> stop
- private repo: Xcode Cloud primary -> GitHub Actions fallback -> stop

After the secondary path has been attempted, the workflow does not ask for another backup path in the same run.

For Xcode Cloud, quota/start-build style conditions are classified as:

- `backup_build_eligible`

If the trigger fails because of credentials, workflow ID, git reference, or another non-quota API/config problem, the workflow classifies the result as:

- `hard_fail`

and stops without entering fallback.

## Required GitHub Configuration

### Secrets

Store these as repository secrets, not environment secrets. The iOS trigger runs through a reusable workflow, and the App Store Connect credentials must be available through the repository-level `secrets` context.

- `APP_STORE_CONNECT_ISSUER_ID`
- `APP_STORE_CONNECT_KEY_ID`
- `APP_STORE_CONNECT_PRIVATE_KEY`

### Variables

Store these as GitHub Environment variables on the stage environments that execute the trigger job, such as `app-mobile@main` and `app-mobile@production`.

- `XCODE_CLOUD_WORKFLOW_ID`
- `ENV_FILE` when mobile builds need environment values written into the app

### Protected Environments

Create these GitHub Environments with required reviewers:

- `app-mobile@ios-build-xcode`
- `app-mobile@ios-build-gha`

## Setup Guide

### 1. Create An App Store Connect API Key

You need an App Store Connect API key with access to Xcode Cloud and workflow/build metadata.

In App Store Connect:

1. open **Users and Access**
2. open the **Integrations** tab
3. create a new API key
4. save the downloaded `.p8` file immediately

From that key, configure these repository-level GitHub secrets:

- `APP_STORE_CONNECT_KEY_ID`
  - the key identifier shown in App Store Connect
- `APP_STORE_CONNECT_ISSUER_ID`
  - the issuer ID shown for your App Store Connect API keys
- `APP_STORE_CONNECT_PRIVATE_KEY`
  - the contents of the downloaded `.p8` file
  - store the whole key body as the secret value
  - escaped newline handling is supported by the workflow script

### 2. Find The Xcode Cloud Workflow ID

The reusable GitHub workflow needs the App Store Connect workflow identifier for the iOS Xcode Cloud workflow.

Recommended way to find it:

1. open App Store Connect
2. open your app
3. open **Xcode Cloud**
4. select the workflow that should build the mobile app
5. inspect the browser URL or workflow details for the workflow identifier

Store that identifier as the GitHub variable:

- `XCODE_CLOUD_WORKFLOW_ID`

This value should point to the workflow that builds the `apps/mobile` app. Put it on the stage environments that run the iOS trigger job, such as `app-mobile@main` and `app-mobile@production`.

### 3. Configure The App Environment File

If the mobile workflow needs runtime values written into `.env`, set:

- `ENV_FILE`

as a GitHub Environment variable on the stage environments that run the trigger job, such as `app-mobile@main` and `app-mobile@production`.

The reusable workflow writes this content into the app before triggering Xcode Cloud.

### 3a. Keep Secrets Out Of The Stage Environment

Do not store these App Store Connect credentials on `app-mobile@main` or `app-mobile@production`:

- `APP_STORE_CONNECT_ISSUER_ID`
- `APP_STORE_CONNECT_KEY_ID`
- `APP_STORE_CONNECT_PRIVATE_KEY`

Keep those three values as repository secrets instead. The reusable iOS workflow can read repository secrets reliably, while environment-scoped secrets are a poor fit for this setup.

### 4. Configure The iOS Build Approval Environment

In GitHub repository settings:

1. open **Settings**
2. open **Environments**
3. create:
   - `app-mobile@ios-build-xcode`
4. add required reviewers

This environment is used whenever the workflow is about to run Xcode Cloud, whether Xcode Cloud is the primary path or the fallback path.

### 4a. Configure The GitHub Backup Approval Environment

In GitHub repository settings:

1. open **Settings**
2. open **Environments**
3. create:
   - `app-mobile@ios-build-gha`
4. add required reviewers

This environment is used whenever the workflow is about to use the GitHub Actions iOS path, whether GitHub Actions is the primary path or the fallback path.

There is no third approval step after fallback. Once the workflow has switched from the primary path to the secondary path, the run ends with that secondary result.

### 4b. Configure Visibility Overrides When Needed

The reusable workflow detects repo visibility from GitHub automatically.

Only set `repository_visibility_override` when:

- you want a manual run to behave like a different repo visibility
- you need to test the opposite path without changing repository settings

If omitted, the workflow defaults to GitHub context:

- public repo → GitHub Actions first
- private repo → Xcode Cloud first

### 5. Configure Xcode Cloud To Use The Repo Script

In Xcode Cloud, ensure the mobile workflow uses the iOS project post-clone script:

- [`apps/mobile/ios/ci_scripts/ci_post_clone.sh`](../../apps/mobile/ios/ci_scripts/ci_post_clone.sh)

The iOS-project script is the Xcode Cloud entrypoint when the workflow is bound to `apps/mobile/ios/clawdi.xcworkspace`. It prepares the monorepo and generates the iOS project during the cloud build.

## Consequences

### Benefits

- repository visibility can steer build cost toward the cheaper path
- both iOS paths are explicitly approved and auditable
- GitHub still provides orchestration, visibility, and approval controls
- Xcode Cloud remains available as the Apple-native path for private repos and fallback cases

### Tradeoffs

- the GitHub Actions iOS path is still placeholder-only
- public repositories still depend on Xcode Cloud today if a real archive is needed
- there is no proactive remaining-hours check in this implementation
- both paths now require separate approvals, which adds one more manual gate when fallback occurs
- each run allows only one fallback, so a failed secondary path ends the run instead of chaining into another backup attempt
