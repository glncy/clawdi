import React, { useState } from "react";
import { View, ScrollView, Pressable, KeyboardAvoidingView } from "react-native";
import { Stack, router } from "expo-router";
import { AppText } from "@/components/atoms/Text";
import { PhosphorIcon } from "@/components/atoms/PhosphorIcon";
import {
  ListGroup,
  Separator,
  Dialog,
  Button,
  Input,
  TextField,
  Label,
} from "heroui-native";
import { Trash, PencilSimple, Plus } from "phosphor-react-native";
import { useCSSVariable } from "uniwind";
import { useFinanceData } from "@/hooks/useFinanceData";
import type { Category } from "@/types";

export default function ManageCategoriesScreen() {
  const { categories, addCategory, updateCategory, deleteCategory } =
    useFinanceData();

  const [dangerColor, primaryColor, mutedColor] = useCSSVariable([
    "--color-danger",
    "--color-primary",
    "--color-muted",
  ]);

  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  );

  const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

  const openAddDialog = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryIcon("");
    setShowDialog(true);
  };

  const openEditDialog = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryIcon(cat.icon);
    setShowDialog(true);
  };

  const confirmDelete = (cat: Category) => {
    setDeletingCategory(cat);
    setShowDeleteDialog(true);
  };

  const handleSave = async () => {
    if (!categoryName.trim() || !categoryIcon.trim()) return;

    if (editingCategory) {
      await updateCategory(editingCategory.id, {
        name: categoryName.trim(),
        icon: categoryIcon.trim(),
      });
    } else {
      const id = `cat-${Date.now()}`;
      await addCategory({
        id,
        name: categoryName.trim(),
        icon: categoryIcon.trim(),
        isDefault: false,
        sortOrder: categories.length,
      });
    }
    setShowDialog(false);
  };

  const handleDelete = async () => {
    if (deletingCategory) {
      await deleteCategory(deletingCategory.id);
    }
    setShowDeleteDialog(false);
    setDeletingCategory(null);
  };

  return (
    <>
      <Stack.Screen options={{ title: "Manage Categories" }} />
      <View className="flex-1 bg-background">
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 py-6 pb-28"
          contentInsetAdjustmentBehavior="automatic"
        >
          <AppText size="sm" color="muted" className="mb-5">
            Add, edit, or remove spending categories.
          </AppText>

          <ListGroup>
          {sorted.map((cat, i) => (
            <React.Fragment key={cat.id}>
              {i > 0 && <Separator className="mx-4" />}
              <ListGroup.Item onPress={() => openEditDialog(cat)}>
                <ListGroup.ItemPrefix>
                  <AppText size="lg">{cat.icon}</AppText>
                </ListGroup.ItemPrefix>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{cat.name}</ListGroup.ItemTitle>
                  {cat.isDefault && (
                    <ListGroup.ItemDescription>
                      Default
                    </ListGroup.ItemDescription>
                  )}
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix>
                  <View className="flex-row items-center gap-2">
                    {!cat.isDefault && (
                      <Pressable onPress={() => confirmDelete(cat)}>
                        <PhosphorIcon
                          icon={Trash}
                          size={16}
                          color={dangerColor as string}
                        />
                      </Pressable>
                    )}
                    <PhosphorIcon
                      icon={PencilSimple}
                      size={16}
                      color={mutedColor as string}
                    />
                  </View>
                </ListGroup.ItemSuffix>
              </ListGroup.Item>
            </React.Fragment>
          ))}
        </ListGroup>

        </ScrollView>
        <View className="absolute bottom-0 left-0 right-0 px-5 pb-10 pt-4">
          <Button
            variant="tertiary"
            className="w-full"
            onPress={openAddDialog}
          >
            <PhosphorIcon
              icon={Plus}
              size={16}
              color={primaryColor as string}
            />
            <Button.Label>Add Category</Button.Label>
          </Button>
        </View>
      </View>

      {/* Add / Edit Dialog */}
      <Dialog isOpen={showDialog} onOpenChange={setShowDialog}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <KeyboardAvoidingView behavior="padding">
            <Dialog.Content>
              <Dialog.Title>
                {editingCategory ? "Edit Category" : "New Category"}
              </Dialog.Title>
              <View className="gap-4 mt-3">
                <TextField>
                  <Label>Icon (emoji)</Label>
                  <Input
                    value={categoryIcon}
                    onChangeText={setCategoryIcon}
                    placeholder="e.g. 🎮"
                    className="text-center text-lg"
                  />
                </TextField>
                <TextField>
                  <Label>Name</Label>
                  <Input
                    value={categoryName}
                    onChangeText={setCategoryName}
                    placeholder="e.g. Gaming"
                    autoCapitalize="words"
                  />
                </TextField>
              </View>
              <View className="flex-row gap-3 mt-5">
                <Button
                  variant="tertiary"
                  className="flex-1"
                  onPress={() => setShowDialog(false)}
                >
                  <Button.Label>Cancel</Button.Label>
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onPress={handleSave}
                  isDisabled={!categoryName.trim() || !categoryIcon.trim()}
                >
                  <Button.Label>Save</Button.Label>
                </Button>
              </View>
            </Dialog.Content>
          </KeyboardAvoidingView>
        </Dialog.Portal>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog isOpen={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Title>Delete Category?</Dialog.Title>
            <Dialog.Description>
              "{deletingCategory?.name}" will be removed. Existing transactions
              using this category won't be affected.
            </Dialog.Description>
            <View className="flex-row gap-3 mt-4">
              <Button
                variant="tertiary"
                className="flex-1"
                onPress={() => setShowDeleteDialog(false)}
              >
                <Button.Label>Cancel</Button.Label>
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onPress={handleDelete}
              >
                <Button.Label>Delete</Button.Label>
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  );
}
