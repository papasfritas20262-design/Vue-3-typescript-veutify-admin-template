<template>
  <v-container fluid class="py-8">
    <v-row class="mb-6" align="center">
      <v-col cols="12" md="8">
        <div class="d-flex align-center gap-2" role="banner">
          <v-icon size="36" color="primary" aria-hidden="true">mdi-tag-multiple</v-icon>
          <div>
            <h1 class="text-h4 font-weight-bold" id="categories-title">Gestión de categorías</h1>
            <p class="text-subtitle-2 text-grey">Organiza las categorías de tu catálogo</p>
          </div>
        </div>
      </v-col>

      <v-col cols="12" md="4" class="text-md-right">
        <v-btn
          color="primary"
          size="large"
          prepend-icon="mdi-plus"
          @click="openDialog()"
          aria-label="Agregar categoría"
        >
          Agregar categoría
        </v-btn>
      </v-col>
    </v-row>

    <v-row class="mb-4" align="center">
      <v-col cols="12" md="6">
        <v-text-field
          v-model="searchQuery"
          placeholder="Buscar categorías..."
          prepend-inner-icon="mdi-magnify"
          clearable
          hide-details
          density="compact"
          variant="outlined"
          aria-label="Buscar categorías"
        />
      </v-col>
      <v-col cols="12" md="6" class="text-md-right text-caption text-grey">
        {{ filteredCount }} categoría(s)
      </v-col>
    </v-row>

    <div v-if="productStore.loading && !filteredCategories.length" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <div v-else-if="!filteredCategories.length" class="text-center py-12 bg-grey-lighten-4 rounded-lg border">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-tag</v-icon>
      <p class="text-h6 text-grey-darken-1">No hay categorías</p>
      <p class="text-body-2 text-grey">Crea la primera categoría para organizar tu catálogo.</p>
    </div>

    <v-row v-else>
      <v-col v-for="item in filteredCategories" :key="item.id" cols="12" sm="6" md="4" lg="3">
        <v-card class="h-100 d-flex flex-column" elevation="1">
          <v-card-item>
            <template #prepend>
              <v-avatar color="primary" variant="tonal">
                <v-icon v-if="item.icon">{{ item.icon }}</v-icon>
                <v-icon v-else>mdi-tag-outline</v-icon>
              </v-avatar>
            </template>
            <v-card-title class="text-subtitle-1 font-weight-bold text-truncate" :title="item.name">
              {{ item.name }}
            </v-card-title>
            <v-card-subtitle class="text-caption text-grey">
              {{ item.icon || "Sin ícono" }}
            </v-card-subtitle>
          </v-card-item>

          <div class="px-4 pb-2">
            <v-chip size="x-small" variant="tonal" color="primary">
              {{ productCountByCategory[item.id] || 0 }} producto(s)
            </v-chip>
          </div>

          <v-spacer></v-spacer>

          <v-divider></v-divider>

          <v-card-actions class="px-3 py-2 bg-grey-lighten-5">
            <v-spacer></v-spacer>
            <v-tooltip location="top" text="Editar categoría">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  color="info"
                  @click="openDialog(item)"
                />
              </template>
            </v-tooltip>
            
            <v-tooltip location="top" text="Eliminar categoría">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  :disabled="(productCountByCategory[item.id] || 0) > 0"
                  @click="confirmDelete(item)"
                />
              </template>
            </v-tooltip>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="520px" persistent>
      <v-card>
        <v-card-title class="bg-primary text-white pa-4">
          {{ editingId ? "Editar categoría" : "Crear categoría" }}
        </v-card-title>

        <v-card-text class="pa-4">
          <v-form ref="formRef" @submit.prevent="onSubmit" lazy-validation>
            <v-text-field
              v-model="formData.name"
              label="Nombre *"
              placeholder="p. ej. Cupcakes"
              prepend-inner-icon="mdi-tag-outline"
              :rules="[rules.required]"
              variant="outlined"
            />
            <v-text-field
              v-model="formData.icon"
              label="Icono (opcional)"
              placeholder="p. ej. mdi-cupcake"
              prepend-inner-icon="mdi-shape-outline"
              variant="outlined"
              hint="Usa nombres de Material Design Icons"
              persistent-hint
            />
          </v-form>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="bg-grey-lighten-5 pa-4">
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" @click="onSubmit" :loading="productStore.loading">
            {{ editingId ? "Actualizar" : "Crear" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="480px">
      <v-card>
        <v-card-title class="bg-error text-white pa-4">Eliminar categoría</v-card-title>
        <v-card-text class="pt-6 text-body-1">
          ¿Seguro que deseas eliminar la categoría <strong>{{ deleteTarget?.name }}</strong>?
          <br>Los productos que ya la usan quedarán sin categoría.
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" @click="performDelete" :loading="productStore.loading">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" multi-line :timeout="snackbar.timeout" location="bottom right">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useProductStore } from "@/stores/useProduct";
import type { Category } from "@/types/product";

const productStore = useProductStore();

const dialog = ref(false);
const deleteDialog = ref(false);
const editingId = ref<string | null>(null);
const searchQuery = ref("");
const deleteTarget = ref<Category | null>(null);

const formRef = ref();
const formData = ref<{ name: string; icon?: string }>({ name: "", icon: "" });

const snackbar = ref({ show: false, message: "", color: "success", timeout: 4000 });

const rules = {
  required: (v: any) => !!v || "Este campo es obligatorio",
};

const categories = computed<Category[]>(() => productStore.categories || []);
const products = computed(() => productStore.products || []);
const productCountByCategory = computed(() => {
  const counts: Record<string, number> = {};
  for (const p of products.value) {
    const id = p.data.category;
    if (!id) continue;
    counts[id] = (counts[id] || 0) + 1;
  }
  return counts;
});
const filteredCategories = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return categories.value;
  return categories.value.filter((c) => c.name.toLowerCase().includes(q));
});
const filteredCount = computed(() => filteredCategories.value.length);

const openDialog = (item?: Category) => {
  if (item) {
    editingId.value = item.id;
    formData.value = { name: item.name, icon: item.icon || "" };
  } else {
    editingId.value = null;
    formData.value = { name: "", icon: "" };
  }
  if (formRef.value?.resetValidation) formRef.value.resetValidation();
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
  if (formRef.value?.resetValidation) formRef.value.resetValidation();
};

const onSubmit = async () => {
  const result = await formRef.value?.validate?.();
  if (result && !result.valid) return;
  const name = formData.value.name.trim();
  const icon = formData.value.icon?.trim() || undefined;
  const exists = categories.value.some((c) => {
    if (editingId.value && c.id === editingId.value) return false;
    return c.name.toLowerCase() === name.toLowerCase();
  });
  if (exists) {
    snackbar.value = { show: true, message: "La categoría ya existe", color: "warning", timeout: 4000 };
    return;
  }
  try {
    if (editingId.value) {
      await productStore.updateCategory(editingId.value, { name, icon });
      snackbar.value = { show: true, message: "Categoría actualizada", color: "success", timeout: 3000 };
    } else {
      await productStore.createCategory({ name, icon });
      snackbar.value = { show: true, message: "Categoría creada", color: "success", timeout: 3000 };
    }
    dialog.value = false;
  } catch (error) {
    console.error("Error guardando categoría:", error);
    snackbar.value = { show: true, message: "Error al guardar categoría", color: "error", timeout: 5000 };
  }
};

const confirmDelete = (item: Category) => {
  deleteTarget.value = item;
  deleteDialog.value = true;
};

const performDelete = async () => {
  if (!deleteTarget.value) return;
  const inUse = products.value.some((p) => p.data.category === deleteTarget.value?.id);
  if (inUse) {
    snackbar.value = {
      show: true,
      message: "No puedes eliminar una categoría en uso por productos",
      color: "warning",
      timeout: 4500,
    };
    return;
  }
  try {
    await productStore.deleteCategory(deleteTarget.value.id);
    snackbar.value = { show: true, message: "Categoría eliminada", color: "success", timeout: 3000 };
    deleteDialog.value = false;
    deleteTarget.value = null;
  } catch (error) {
    console.error("Error eliminando categoría:", error);
    snackbar.value = { show: true, message: "No se pudo eliminar", color: "error", timeout: 5000 };
  }
};

onMounted(async () => {
  productStore.listenProducts();
  await productStore.fetchCategories();
});

onUnmounted(() => {
  productStore.stopListeningProducts();
});
</script>

<style scoped>
.gap-2 {
  gap: 0.5rem;
}
</style>
