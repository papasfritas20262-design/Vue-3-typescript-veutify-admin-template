<template>
  <v-container fluid class="py-8">
    <v-row class="mb-6" align="center">
      <v-col cols="12" md="8">
        <div class="d-flex align-center gap-2" role="banner">
          <v-icon size="36" color="primary" aria-hidden="true">mdi-package-variant-multiple</v-icon>
          <div>
            <h1 class="text-h4 font-weight-bold" id="products-title">Gestión de productos</h1>
            <p class="text-subtitle-2 text-grey">Administra tu catálogo de productos</p>
          </div>
        </div>
      </v-col>

      <v-col cols="12" md="4" class="text-md-right">
        <v-btn
          color="primary"
          size="large"
          prepend-icon="mdi-plus"
          @click="openDialog()"
          aria-label="Agregar producto"
        >
          Agregar producto
        </v-btn>
      </v-col>
    </v-row>

    <v-row class="mb-4" align="center">
      <v-col cols="12" md="6">
        <v-text-field
          v-model="searchQuery"
          placeholder="Buscar productos..."
          prepend-inner-icon="mdi-magnify"
          clearable
          hide-details
          density="compact"
          variant="outlined"
          aria-label="Buscar productos"
        />
      </v-col>

      <v-col cols="8" md="3">
        <v-select
          v-model="selectedCategory"
          :items="categories"
          item-title="name"
          item-value="id"
          placeholder="Filtrar por categoría"
          clearable
          hide-details
          density="compact"
          variant="outlined"
          aria-label="Filtrar por categoría"
        />
      </v-col>

      <v-col cols="4" md="3" class="text-end">
        <v-btn
          variant="outlined"
          @click="exportCsv"
          :disabled="!products.length"
          prepend-icon="mdi-download"
          aria-label="Exportar CSV"
        >
          Exportar CSV
        </v-btn>
      </v-col>
    </v-row>

    <div v-if="productStore.loading && !paginatedItems.length" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <div v-else-if="!paginatedItems.length" class="text-center py-12 bg-grey-lighten-4 rounded-lg border">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-package-variant-closed</v-icon>
      <p class="text-h6 text-grey-darken-1">No hay productos</p>
      <p class="text-body-2 text-grey">Empieza agregando tu primer producto o ajusta tus filtros.</p>
    </div>

    <v-row v-else>
      <v-col v-for="item in paginatedItems" :key="item.id" cols="12" sm="6" md="4" lg="3">
        <v-card
          hover
          class="h-100 d-flex flex-column cursor-pointer transition-swing"
          @click="openDialog(item)"
          :aria-label="`Editar producto ${item.data.name}`"
        >
          <v-img
            :src="item.data.image || ''"
            height="200"
            cover
            class="bg-grey-lighten-3 align-start"
          >
            <template v-slot:placeholder>
              <div class="d-flex align-center justify-center h-100">
                <v-icon size="64" color="grey-lighten-1">mdi-image-outline</v-icon>
              </div>
            </template>
            <v-chip
              v-if="item.data.featured"
              color="warning"
              size="small"
              class="ma-3 font-weight-bold"
              prepend-icon="mdi-star"
              elevation="2"
            >
              Destacado
            </v-chip>
          </v-img>

          <v-card-item class="pb-1">
            <v-card-title class="text-h6 font-weight-bold text-truncate" :title="item.data.name">
              {{ item.data.name }}
            </v-card-title>
            <v-card-subtitle class="text-truncate">
              {{ item.data.brand || "Sin marca" }}
            </v-card-subtitle>
          </v-card-item>

          <v-card-text class="flex-grow-1 pt-2">
            <div class="d-flex justify-space-between align-center mb-3">
              <span class="text-h5 text-primary font-weight-black">${{ formatPrice(item.data.price) }}</span>
              <v-chip size="x-small" variant="tonal" :title="getCategoryName(item.data.category)">
                {{ getCategoryName(item.data.category) }}
              </v-chip>
            </div>

            <div class="d-flex justify-space-between align-center">
              <v-chip
                :color="getStockColor(item.data.stock)"
                text-color="white"
                size="small"
                variant="flat"
              >
                {{ item.data.stock ?? 0 }} en stock
              </v-chip>

              <v-rating
                v-if="item.data.rating"
                :model-value="item.data.rating"
                readonly
                size="small"
                color="warning"
                density="compact"
                half-increments
              />
              <span v-else class="text-caption text-grey">Sin rating</span>
            </div>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-actions class="px-3 py-2 bg-grey-lighten-5">
            <v-spacer></v-spacer>
            <v-tooltip location="top" text="Ver detalles">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-eye"
                  size="small"
                  variant="text"
                  color="info"
                  @click.stop="viewDetails(item)"
                />
              </template>
            </v-tooltip>
            
            <v-tooltip location="top" text="Eliminar producto">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  @click.stop="confirmDelete(item)"
                />
              </template>
            </v-tooltip>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-card v-if="filteredCount > 0" class="mt-6 pa-4 elevation-1">
      <div class="d-flex flex-column flex-sm-row justify-space-between align-center gap-4">
        <div class="text-caption text-grey">
          Mostrando {{ pageStart }}–{{ pageEnd }} de {{ filteredCount }} productos
        </div>

        <div class="d-flex align-center gap-4">
          <v-select
            v-model="itemsPerPage"
            :items="itemsPerPageOptions"
            hide-details
            density="compact"
            variant="outlined"
            style="width: 110px"
            aria-label="Productos por página"
            prefix="Ver:"
          />
          <v-pagination
            v-model="page"
            :length="totalPages"
            prev-icon="mdi-chevron-left"
            next-icon="mdi-chevron-right"
            density="compact"
            aria-label="Paginación de productos"
          />
        </div>
      </div>
    </v-card>

    <v-dialog v-model="dialog" max-width="640px" persistent scrollable>
      <v-card>
        <v-card-title class="bg-primary text-white pa-4">
          {{ editingId ? "Editar producto" : "Crear producto" }}
        </v-card-title>

        <v-card-text class="pa-4">
          <v-form ref="formRef" @submit.prevent="onSubmit" lazy-validation>
            <v-row>
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="formData.name"
                  label="Nombre *"
                  placeholder="p. ej. Cupcake de chocolate"
                  prepend-inner-icon="mdi-text"
                  :rules="[rules.required]"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="formData.price"
                  label="Precio *"
                  placeholder="0.00"
                  prepend-inner-icon="mdi-currency-usd"
                  type="number"
                  :rules="[rules.required, rules.minPrice]"
                  variant="outlined"
                  step="0.01"
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="formData.description"
                  label="Descripción"
                  placeholder="Descripción del producto..."
                  prepend-inner-icon="mdi-note-text"
                  rows="3"
                  variant="outlined"
                />
              </v-col>

      <v-col cols="12" md="4">
        <v-select
          v-model="formData.category"
          label="Categoría"
          :items="categories"
          item-title="name"
          item-value="id"
          prepend-inner-icon="mdi-tag"
          variant="outlined"
        >
          <template #append-inner>
            <v-tooltip text="Agregar categoría" location="top">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-plus"
                  size="x-small"
                  variant="text"
                  @click.stop="openCategoryDialog"
                  aria-label="Agregar categoría"
                />
              </template>
            </v-tooltip>
          </template>
        </v-select>
      </v-col>

              <v-col cols="12" md="4">
                <v-text-field
                  v-model="formData.brand"
                  label="Marca"
                  placeholder="p. ej. CupcakeMania"
                  prepend-inner-icon="mdi-trademark"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="formData.stock"
                  label="Stock"
                  placeholder="0"
                  prepend-inner-icon="mdi-warehouse"
                  type="number"
                  :rules="[rules.minStock]"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="8">
                <v-text-field
                  v-model="formData.image"
                  label="URL de imagen"
                  placeholder="https://..."
                  prepend-inner-icon="mdi-image"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="4" class="d-flex flex-column justify-center">
                <div class="text-caption text-grey mb-1">Calificación</div>
                <v-rating v-model="formData.rating" hover color="warning" density="compact" />
                
                <v-checkbox
                  v-model="formData.featured"
                  label="Destacado"
                  color="warning"
                  hide-details
                  class="mt-2"
                />
              </v-col>
            </v-row>
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
        <v-card-title class="bg-error text-white pa-4">Eliminar producto</v-card-title>
        <v-card-text class="pt-6 text-body-1">
          ¿Seguro que deseas eliminar el producto <strong>{{ deleteTarget?.data.name }}</strong>?
          <br>Esta acción no se puede deshacer.
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" @click="performDelete" :loading="productStore.loading">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="categoryDialog" max-width="480px" persistent>
      <v-card>
        <v-card-title class="bg-primary text-white pa-4">Agregar categoría</v-card-title>
        <v-card-text class="pa-4">
          <v-form ref="categoryFormRef" @submit.prevent="saveCategory" lazy-validation>
            <v-text-field
              v-model="categoryForm.name"
              label="Nombre *"
              placeholder="p. ej. Cupcakes"
              prepend-inner-icon="mdi-tag-outline"
              :rules="[rules.required]"
              variant="outlined"
            />
            <v-text-field
              v-model="categoryForm.icon"
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
          <v-btn variant="text" @click="closeCategoryDialog">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" @click="saveCategory" :loading="productStore.loading">
            Crear
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-navigation-drawer v-model="detailsDrawer" temporary location="right" width="420">
      <v-card v-if="selectedProduct" class="h-100 rounded-0" elevation="0">
        <v-toolbar color="primary" class="text-white">
          <v-toolbar-title>Detalles del producto</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="detailsDrawer = false"></v-btn>
        </v-toolbar>

        <v-card-text class="pt-6">
          <v-img
            v-if="selectedProduct.data.image"
            :src="selectedProduct.data.image"
            aspect-ratio="1"
            class="mb-6 rounded-lg elevation-2 bg-grey-lighten-3"
            cover
          />
          <div v-else class="bg-grey-lighten-2 rounded-lg mb-6 d-flex align-center justify-center elevation-1" style="height:280px;">
            <v-icon size="80" color="grey">mdi-package-variant</v-icon>
          </div>

          <div class="mb-4">
            <p class="text-caption text-uppercase text-grey-darken-1 font-weight-bold mb-1">Nombre</p>
            <p class="text-h6">{{ selectedProduct.data.name }}</p>
          </div>
          
          <v-divider class="mb-4"></v-divider>

          <div class="mb-4">
            <p class="text-caption text-uppercase text-grey-darken-1 font-weight-bold mb-1">Descripción</p>
            <p class="text-body-1">{{ selectedProduct.data.description || "—" }}</p>
          </div>

          <v-row class="mb-2">
            <v-col cols="6">
              <p class="text-caption text-uppercase text-grey-darken-1 font-weight-bold mb-1">Precio</p>
              <p class="text-h6 text-primary">${{ formatPrice(selectedProduct.data.price) }}</p>
            </v-col>
            <v-col cols="6">
              <p class="text-caption text-uppercase text-grey-darken-1 font-weight-bold mb-1">Stock</p>
              <v-chip :color="getStockColor(selectedProduct.data.stock)" text-color="white" size="small">
                {{ selectedProduct.data.stock || 0 }} unidades
              </v-chip>
            </v-col>
          </v-row>

          <v-row class="mb-4">
            <v-col cols="6">
              <p class="text-caption text-uppercase text-grey-darken-1 font-weight-bold mb-1">Categoría</p>
              <p class="text-body-2">{{ getCategoryName(selectedProduct.data.category) || "—" }}</p>
            </v-col>
            <v-col cols="6">
              <p class="text-caption text-uppercase text-grey-darken-1 font-weight-bold mb-1">Rating</p>
              <v-rating
                v-if="selectedProduct.data.rating"
                :model-value="selectedProduct.data.rating"
                readonly
                color="warning"
                density="compact"
                size="small"
              />
              <p v-else class="text-body-2 text-grey">Sin calificación</p>
            </v-col>
          </v-row>

          <div v-if="selectedProduct.data.featured" class="mt-4 bg-warning-lighten-4 pa-3 rounded text-center border-warning">
            <v-icon color="warning" class="mr-2">mdi-star</v-icon>
            <span class="text-warning-darken-2 font-weight-medium">Este es un producto destacado</span>
          </div>
        </v-card-text>
      </v-card>
    </v-navigation-drawer>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" multi-line :timeout="snackbar.timeout" location="bottom right">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useProductStore } from "@/stores/useProduct";
import type { Product, Category } from "@/types/product";

/* ----------------------
   Stores & state
   ---------------------- */
const productStore = useProductStore();

/* UI state */
const dialog = ref(false);
const deleteDialog = ref(false);
const detailsDrawer = ref(false);
const searchQuery = ref("");
const selectedCategory = ref<string | null>(null);
const editingId = ref<string | null>(null);
const deleteTarget = ref<{ id: string; data: Product } | null>(null);
const selectedProduct = ref<{ id: string; data: Product } | null>(null);
const categoryDialog = ref(false);

/* Form */
const formRef = ref();
const formData = ref<Product>({
  name: "",
  description: "",
  price: 0,
  category: "",
  brand: "",
  image: "",
  stock: 0,
  rating: 0,
  featured: false,
});

/* Category form */
const categoryFormRef = ref();
const categoryForm = ref<{ name: string; icon?: string }>({
  name: "",
  icon: "",
});

/* Snackbar for feedback */
const snackbar = ref({ show: false, message: "", color: "success", timeout: 4000 });

/* Sorting */
const sortBy = ref<{ key: string; order: 'asc' | 'desc' }[]>([{ key: "name", order: "asc" }]);

/* Pagination */
const page = ref(1);
const itemsPerPage = ref(10);
const itemsPerPageOptions = [5, 10, 20, 50];

/* Debounce search */
let searchTimer: number | undefined;

/* ----------------------
   Validation rules
   ---------------------- */
const rules = {
  required: (v: any) => !!v || "Este campo es obligatorio",
  minPrice: (v: number) => (typeof v === "number" && v > 0) || "El precio debe ser mayor que 0",
  minStock: (v: number) => (typeof v !== "number" || v >= 0) || "Stock no puede ser negativo",
};

/* ----------------------
   Headers (Mantenidos para evitar romper dependencias externas o lógica futura)
   ---------------------- */
// const headers = [
//   { title: "Producto", value: "name", sortable: true },
//   { title: "Categoría", value: "category", sortable: true },
//   { title: "Precio", value: "price", sortable: true },
//   { title: "Stock", value: "stock", sortable: true },
//   { title: "Rating", value: "rating", sortable: false },
//   { title: "Acciones", value: "actions", sortable: false, align: "end" as const },
// ];

/* ----------------------
   Derived data
   ---------------------- */
const products = computed(() => productStore.products);
const categories = computed<Category[]>(() => productStore.categories || []);

/* Filtered + searched list (debounced search) */
const filteredProducts = ref<{ id: string; data: Product }[]>([]);

watch([() => products.value, () => selectedCategory.value, () => searchQuery.value], () => {
  if (searchTimer) clearTimeout(searchTimer);
  // Small debounce to avoid filtering on every keystroke
  searchTimer = window.setTimeout(() => {
    const q = searchQuery.value?.trim().toLowerCase() || "";
    filteredProducts.value = products.value.filter((product) => {
      const matchesSearch =
        !q ||
        product.data.name.toLowerCase().includes(q) ||
        (product.data.description && product.data.description.toLowerCase().includes(q)) ||
        (product.data.brand && product.data.brand.toLowerCase().includes(q));

      const matchesCategory = !selectedCategory.value || product.data.category === selectedCategory.value;
      return matchesSearch && matchesCategory;
    });
    page.value = 1; // reset page when filters change
  }, 220);
}, { immediate: true });

/* Pagination helpers */
const filteredCount = computed(() => filteredProducts.value.length);
const totalPages = computed(() => Math.max(1, Math.ceil(filteredCount.value / itemsPerPage.value)));
const paginatedItems = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  // Simple client-side sort by selected criteria
  const sorted = [...filteredProducts.value];
  if (sortBy.value.length > 0) {
    const { key, order } = sortBy.value[0];
    sorted.sort((a, b) => {
      const av = (a as any).data[key as keyof Product];
      const bv = (b as any).data[key as keyof Product];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "string") {
        return order === "desc" ? bv.localeCompare(av) : av.localeCompare(bv);
      }
      return order === "desc" ? Number(bv) - Number(av) : Number(av) - Number(bv);
    });
  }
  return sorted.slice(start, end);
});
const pageStart = computed(() => filteredCount.value === 0 ? 0 : (page.value - 1) * itemsPerPage.value + 1);
const pageEnd = computed(() => Math.min(filteredCount.value, page.value * itemsPerPage.value));

watch(filteredCount, (n) => {
  if (page.value > Math.max(1, Math.ceil(n / itemsPerPage.value))) page.value = 1;
});

/* ----------------------
   Utility functions
   ---------------------- */
const getCategoryName = (categoryId?: string) => {
  if (!categoryId) return "—";
  const cat = categories.value.find((c) => c.id === categoryId);
  return cat?.name || "—";
};

const formatPrice = (price = 0) => {
  return Number(price).toFixed(2);
};

const getStockColor = (stock: number | undefined) => {
  if (stock == null) return "error";
  if (stock <= 0) return "error";
  if (stock < 5) return "warning";
  return "success";
};

/* ----------------------
   Actions
   ---------------------- */
const openDialog = (item?: { id: string; data: Product }) => {
  if (item) {
    editingId.value = item.id;
    formData.value = { ...item.data };
  } else {
    editingId.value = null;
    formData.value = {
      name: "",
      description: "",
      price: 0,
      category: "",
      brand: "",
      image: "",
      stock: 0,
      rating: 0,
      featured: false,
    };
  }
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
  // reset validation if needed
  if (formRef.value?.resetValidation) formRef.value.resetValidation();
};

const openCategoryDialog = () => {
  categoryForm.value = { name: "", icon: "" };
  if (categoryFormRef.value?.resetValidation) categoryFormRef.value.resetValidation();
  categoryDialog.value = true;
};

const closeCategoryDialog = () => {
  categoryDialog.value = false;
  if (categoryFormRef.value?.resetValidation) categoryFormRef.value.resetValidation();
};

const onSubmit = async () => {
  const result = await formRef.value?.validate?.();
  if (result && !result.valid) return;
  try {
    if (editingId.value) {
      await productStore.updateProduct(editingId.value, formData.value);
      snackbar.value = { show: true, message: "Producto actualizado", color: "success", timeout: 3000 };
    } else {
      await productStore.createProduct(formData.value);
      snackbar.value = { show: true, message: "Producto creado", color: "success", timeout: 3000 };
    }
    dialog.value = false;
  } catch (error) {
    console.error("Error guardando producto:", error);
    snackbar.value = { show: true, message: "Error al guardar producto", color: "error", timeout: 5000 };
  }
};

const saveCategory = async () => {
  const result = await categoryFormRef.value?.validate?.();
  if (result && !result.valid) return;
  const name = categoryForm.value.name.trim();
  const icon = categoryForm.value.icon?.trim() || undefined;
  const exists = categories.value.some((c) => c.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    snackbar.value = { show: true, message: "La categoría ya existe", color: "warning", timeout: 4000 };
    return;
  }
  try {
    const newId = await productStore.createCategory({ name, icon });
    if (newId) formData.value.category = newId;
    await productStore.fetchCategories();
    categoryDialog.value = false;
    snackbar.value = { show: true, message: "Categoría creada", color: "success", timeout: 3000 };
  } catch (error) {
    console.error("Error creando categoría:", error);
    snackbar.value = { show: true, message: "No se pudo crear la categoría", color: "error", timeout: 5000 };
  }
};

const confirmDelete = (item: { id: string; data: Product }) => {
  deleteTarget.value = item;
  deleteDialog.value = true;
};

const performDelete = async () => {
  if (!deleteTarget.value) return;
  try {
    await productStore.deleteProduct(deleteTarget.value.id);
    snackbar.value = { show: true, message: "Producto eliminado", color: "success", timeout: 3000 };
    deleteDialog.value = false;
    deleteTarget.value = null;
  } catch (error) {
    console.error("Error eliminando producto:", error);
    snackbar.value = { show: true, message: "No se pudo eliminar", color: "error", timeout: 5000 };
  }
};

const viewDetails = (item: { id: string; data: Product }) => {
  selectedProduct.value = item;
  detailsDrawer.value = true;
};

/* Export CSV (simple) */
const exportCsv = () => {
  const rows = [
    ["id", "name", "brand", "category", "price", "stock", "rating", "featured"],
    ...products.value.map((p) => [
      p.id,
      p.data.name,
      p.data.brand || "",
      getCategoryName(p.data.category),
      p.data.price ?? 0,
      p.data.stock ?? 0,
      p.data.rating ?? "",
      p.data.featured ? "true" : "false",
    ]),
  ];

  const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `productos_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

/* ----------------------
   Lifecycle
   ---------------------- */
onMounted(async () => {
  // Inicializa listeners y carga categorias
  productStore.listenProducts();
  await productStore.fetchCategories();
});

onUnmounted(() => {
  if (searchTimer) clearTimeout(searchTimer);
  productStore.stopListeningProducts();
});
</script>

<style scoped>
.gap-2 {
  gap: 0.5rem;
}
.gap-1 {
  gap: 0.25rem;
}
.cursor-pointer {
  cursor: pointer;
}
</style>
