"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import PrimaryButton from "@/components/ui/primary-button";
import FileUpload from "@/components/ui/file-upload";
import FileUploadMultiple from "@/components/ui/file-upload-multiple";
import FormField from "@/components/forms/form-field";
import { useCrud } from "@/hooks/useCRUD";
import { useForm } from "@/hooks/useForm";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { API_ROUTES } from "@/config/api-routes";
import { revalidateProduct, revalidateProducts } from "@/actions/revalidate-action";
import SubmittingLoader from "@/components/dashboard/submitting-loader";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import type { ProductFormProps } from "@/types/components";
import type { ProductVariant } from "@/types/product";

interface VariantRow {
  sku: string;
  price: string;
  compareAtPrice: string;
  costPrice: string;
  stockQuantity: string;
  allowBackorder: boolean;
  lowStockThreshold: string;
  weight: string;
  barcode: string;
  attributes: { attributeName: string; attributeValue: string }[];
}

function createEmptyVariant(): VariantRow {
  return {
    sku: "",
    price: "",
    compareAtPrice: "",
    costPrice: "",
    stockQuantity: "",
    allowBackorder: false,
    lowStockThreshold: "5",
    weight: "",
    barcode: "",
    attributes: [],
  };
}

function variantFromExisting(v: ProductVariant): VariantRow {
  return {
    sku: v.sku,
    price: v.price?.toString() || "",
    compareAtPrice: v.compareAtPrice?.toString() || "",
    costPrice: v.costPrice?.toString() || "",
    stockQuantity: v.stockQuantity?.toString() || "",
    allowBackorder: v.allowBackorder ?? false,
    lowStockThreshold: v.lowStockThreshold?.toString() || "5",
    weight: v.weight?.toString() || "",
    barcode: v.barcode || "",
    attributes: v.attributes?.map((a) => ({ attributeName: a.attributeName, attributeValue: a.attributeValue })) || [],
  };
}

const selectClass = "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50";

export function ProductForm({ product }: ProductFormProps) {
  const isEditing = !!product;

  const { create, put } = useCrud<Record<string, any>>({
    endpoint: API_ROUTES.PRODUCT,
    queryKey: "products",
    isAuthenticated: true,
  });

  const { getAll: getCategories } = useCrud<{ id: string; name: string }>({
    endpoint: API_ROUTES.CATEGORY,
    queryKey: "categories",
  });
  const { getAll: getSubcategories } = useCrud<{ id: string; name: string; categoryId: string }>({
    endpoint: API_ROUTES.SUBCATEGORY,
    queryKey: "subcategories",
  });
  const { getAll: getBrands } = useCrud<{ id: string; name: string }>({
    endpoint: API_ROUTES.BRAND,
    queryKey: "brands",
  });

  const { data: categoriesData } = getCategories({ take: 100, skip: 0 });
  const { data: subcategoriesData } = getSubcategories({ take: 100, skip: 0 });
  const { data: brandsData } = getBrands({ take: 100, skip: 0 });
  const categories: { id: string; name: string }[] = categoriesData || [];
  const allSubcategories: { id: string; name: string; categoryId: string }[] = subcategoriesData || [];
  const brands: { id: string; name: string }[] = brandsData || [];

  const { values, errors, setField } = useForm({
    name: product?.name || "",
    slug: product?.slug || "",
    description: product?.description || "",
    categoryId: product?.categoryId || "",
    subcategoryId: product?.subcategoryId || "",
    brandId: product?.brandId || "",
    sku: product?.sku || "",
    status: product?.status || "active",
    isFeatured: product?.isFeatured ?? false,
    tags: product?.tags?.join(", ") || "",
    isActive: product?.isActive ?? true,
    images: product?.images?.map((img) => ({ key: img.imageKey, url: img.url, isPrimary: img.isPrimary })) || [],
  });

  const subcategories = values.categoryId
    ? allSubcategories.filter((sub) => sub.categoryId === values.categoryId)
    : [];

  // Initialize variants from product data
  // If product has variants array with items, use those
  // Otherwise, create a single variant row from product-level fields
  const [variants, setVariants] = useState<VariantRow[]>(() => {
    if (product?.variants && product.variants.length > 0) {
      return product.variants.map(variantFromExisting);
    }
    // No variants — create a row from product-level fields
    if (product?.price !== undefined || product?.stockQuantity !== undefined) {
      return [{
        sku: product?.sku || "",
        name: "",
        price: product?.price?.toString() || "",
        compareAtPrice: product?.compareAtPrice?.toString() || "",
        costPrice: product?.costPrice?.toString() || "",
        stockQuantity: product?.stockQuantity?.toString() || "",
        allowBackorder: product?.allowBackorder ?? false,
        lowStockThreshold: product?.lowStockThreshold?.toString() || "5",
        weight: product?.weight?.toString() || "",
        barcode: product?.barcode || "",
        attributes: [],
      }];
    }
    return [];
  });
  const [useVariants, setUseVariants] = useState((product?.variants?.length ?? 0) > 0);

  const isPending = isEditing ? put.isPending : create.isPending;

  const { onSuccess, onError } = useFormSubmit({
    entityName: "Product",
    redirectPath: "/dashboard/products",
    entityId: product?.id,
    revalidateAction: async (payload?: Record<string, any>) => {
      if (isEditing && product?.slug) {
        // If slug changed, revalidate both old and new slug
        const newSlug = payload?.slug;
        if (newSlug && newSlug !== product.slug) {
          await revalidateProduct(product.slug);
          await revalidateProduct(newSlug);
        } else {
          await revalidateProduct(product.slug);
        }
      } else {
        // Product creation - revalidate products list
        await revalidateProducts();
      }
    },
  });

  const addVariant = () => {
    setVariants([...variants, createEmptyVariant()]);
    setUseVariants(true);
  };

  const removeVariant = (index: number) => {
    const next = variants.filter((_, i) => i !== index);
    setVariants(next);
    if (next.length === 0) setUseVariants(false);
  };

  const updateVariant = (index: number, field: keyof VariantRow, value: any) => {
    setVariants(variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  const addAttribute = (variantIndex: number) => {
    setVariants(variants.map((v, i) =>
      i === variantIndex
        ? { ...v, attributes: [...v.attributes, { attributeName: "", attributeValue: "" }] }
        : v
    ));
  };

  const removeAttribute = (variantIndex: number, attrIndex: number) => {
    setVariants(variants.map((v, i) =>
      i === variantIndex
        ? { ...v, attributes: v.attributes.filter((_, ai) => ai !== attrIndex) }
        : v
    ));
  };

  const updateAttribute = (variantIndex: number, attrIndex: number, field: "attributeName" | "attributeValue", value: string) => {
    setVariants(variants.map((v, i) =>
      i === variantIndex
        ? {
            ...v,
            attributes: v.attributes.map((a, ai) =>
              ai === attrIndex ? { ...a, [field]: value } : a
            ),
          }
        : v
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const slug =
      values.slug ||
      values.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const payload: Record<string, any> = {
      name: values.name,
      slug,
      description: values.description,
      categoryId: values.categoryId || undefined,
      subcategoryId: values.subcategoryId || undefined,
      brandId: values.brandId || undefined,
      sku: values.sku || undefined,
      status: values.status,
      isFeatured: values.isFeatured,
      isActive: values.isActive,
      tags: values.tags
        ? values.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : undefined,
      images: values.images.map((img) => img.key),
    };

    if (useVariants && variants.length > 0) {
      payload.variants = variants.map((v, i) => {
        const variantPayload: Record<string, any> = {
          sku: v.sku,
          price: parseInt(v.price, 10) || 0,
          stockQuantity: parseInt(v.stockQuantity, 10) || 0,
          sortOrder: i,
        };
        if (v.compareAtPrice) variantPayload.compareAtPrice = parseInt(v.compareAtPrice, 10);
        if (v.costPrice) variantPayload.costPrice = parseInt(v.costPrice, 10);
        if (v.allowBackorder) variantPayload.allowBackorder = true;
        if (v.lowStockThreshold) variantPayload.lowStockThreshold = parseInt(v.lowStockThreshold, 10);
        if (v.weight) variantPayload.weight = parseInt(v.weight, 10);
        if (v.barcode) variantPayload.barcode = v.barcode;
        if (v.attributes.length > 0) {
          variantPayload.attributes = v.attributes
            .filter((a) => a.attributeName && a.attributeValue)
            .map((a, ai) => ({
              attributeName: a.attributeName,
              attributeValue: a.attributeValue,
              sortOrder: ai,
            }));
        }
        return variantPayload;
      });
    } else {
      const firstVariant = variants[0];
      if (firstVariant) {
        if (firstVariant.price) {
          payload.price = parseInt(firstVariant.price, 10);
        }
        if (firstVariant.compareAtPrice) {
          payload.compareAtPrice = parseInt(firstVariant.compareAtPrice, 10);
        }
        if (firstVariant.costPrice) {
          payload.costPrice = parseInt(firstVariant.costPrice, 10);
        }
        if (firstVariant.stockQuantity) {
          payload.stockQuantity = parseInt(firstVariant.stockQuantity, 10);
        }
        if (firstVariant.weight) {
          payload.weight = parseInt(firstVariant.weight, 10);
        }
      }
    }

    if (isEditing) {
      put.mutate({ id: product.id, data: payload }, { onSuccess, onError });
    } else {
      create.mutate(payload, { onSuccess, onError });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {isPending && <SubmittingLoader status={isEditing ? "Updating product" : "Creating product"} />}

      {/* Product Information */}
      <div className="bg-white rounded-md border border-slate-200 shadow-xs p-6 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Product Information</h3>
          <p className="text-xs text-slate-500 mt-1">Basic product details.</p>
        </div>

        <FormField
          label="Name *"
          name="name"
          value={values.name}
          onChange={(e) => setField("name", e.target.value)}
          placeholder="Product name"
          errors={errors.name}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Category</label>
            <select
              name="categoryId"
              value={values.categoryId}
              onChange={(e) => {
                setField("categoryId", e.target.value);
                setField("subcategoryId", "");
              }}
              className={selectClass}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Subcategory</label>
            <select
              name="subcategoryId"
              value={values.subcategoryId}
              onChange={(e) => setField("subcategoryId", e.target.value)}
              className={selectClass}
              disabled={!values.categoryId}
            >
              <option value="">Select a subcategory</option>
              {subcategories.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Brand</label>
            <select
              name="brandId"
              value={values.brandId}
              onChange={(e) => setField("brandId", e.target.value)}
              className={selectClass}
            >
              <option value="">Select a brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Description</label>
          <TiptapEditor
            content={values.description}
            onChange={(content) => setField("description", content)}
            placeholder="Product description"
            className="min-h-[200px] max-h-[300px]"
          />
        </div>

        <FormField
          label="Tags (comma-separated)"
          name="tags"
          value={values.tags}
          onChange={(e) => setField("tags", e.target.value)}
          placeholder="tag1, tag2, tag3"
          errors={errors.tags}
        />
      </div>

      {/* Variants */}
      <div className="bg-white rounded-md border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Product Variants</h3>
            <p className="text-xs text-slate-500 mt-1">
              Add variants for different options (size, color, etc.). If none added, a default variant is created automatically.
            </p>
          </div>
          <Button type="button" variant="default" size="sm" onClick={addVariant}>
            + Add Variant
          </Button>
        </div>

        {!useVariants && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              No variants. Price and stock below create a default variant automatically.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                label="Price*"
                name="defaultPrice"
                type="number"
                value={variants[0]?.price || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setVariants((prev) => {
                    if (prev.length === 0) {
                      const v = createEmptyVariant();
                      v.price = val;
                      return [v];
                    }
                    return prev.map((v, i) => (i === 0 ? { ...v, price: val } : v));
                  });
                }}
                placeholder="99999"
                hint="e.g. 99999 = 999.99"
              />
              <FormField
                label="Compare At Price"
                name="defaultCompareAtPrice"
                type="number"
                value={variants[0]?.compareAtPrice || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setVariants((prev) => {
                    if (prev.length === 0) {
                      const v = createEmptyVariant();
                      v.compareAtPrice = val;
                      return [v];
                    }
                    return prev.map((v, i) => (i === 0 ? { ...v, compareAtPrice: val } : v));
                  });
                }}
                placeholder="109999"
              />
              <FormField
                label="Cost Price"
                name="defaultCostPrice"
                type="number"
                value={variants[0]?.costPrice || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setVariants((prev) => {
                    if (prev.length === 0) {
                      const v = createEmptyVariant();
                      v.costPrice = val;
                      return [v];
                    }
                    return prev.map((v, i) => (i === 0 ? { ...v, costPrice: val } : v));
                  });
                }}
                placeholder="50000"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                label="Stock Quantity"
                name="defaultStockQuantity"
                type="number"
                value={variants[0]?.stockQuantity || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setVariants((prev) => {
                    if (prev.length === 0) {
                      const v = createEmptyVariant();
                      v.stockQuantity = val;
                      return [v];
                    }
                    return prev.map((v, i) => (i === 0 ? { ...v, stockQuantity: val } : v));
                  });
                }}
                placeholder="0"
              />
              <FormField
                label="SKU"
                name="defaultSku"
                value={variants[0]?.sku || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setVariants((prev) => {
                    if (prev.length === 0) {
                      const v = createEmptyVariant();
                      v.sku = val;
                      return [v];
                    }
                    return prev.map((v, i) => (i === 0 ? { ...v, sku: val } : v));
                  });
                }}
                placeholder="PROD-001"
              />
              <FormField
                label="Weight (g)"
                name="defaultWeight"
                type="number"
                value={variants[0]?.weight || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setVariants((prev) => {
                    if (prev.length === 0) {
                      const v = createEmptyVariant();
                      v.weight = val;
                      return [v];
                    }
                    return prev.map((v, i) => (i === 0 ? { ...v, weight: val } : v));
                  });
                }}
                placeholder="200"
              />
            </div>
          </div>
        )}

        {useVariants && variants.map((variant, vi) => (
          <div key={vi} className="rounded-md border border-slate-200 bg-slate-50/50 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Variant {vi + 1}
              </h4>
              <button
                type="button"
                onClick={() => removeVariant(vi)}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium"
              >
                Remove
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="SKU"
                name={`variant-sku-${vi}`}
                value={variant.sku}
                onChange={(e) => updateVariant(vi, "sku", e.target.value)}
                placeholder="PROD-001-BLU"
              />
              <FormField
                label="Price (paisa) *"
                name={`variant-price-${vi}`}
                type="number"
                value={variant.price}
                onChange={(e) => updateVariant(vi, "price", e.target.value)}
                placeholder="99999"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                label="Compare At Price"
                name={`variant-compare-${vi}`}
                type="number"
                value={variant.compareAtPrice}
                onChange={(e) => updateVariant(vi, "compareAtPrice", e.target.value)}
                placeholder="109999"
              />
              <FormField
                label="Cost Price"
                name={`variant-cost-${vi}`}
                type="number"
                value={variant.costPrice}
                onChange={(e) => updateVariant(vi, "costPrice", e.target.value)}
                placeholder="50000"
              />
              <FormField
                label="Stock Quantity"
                name={`variant-stock-${vi}`}
                type="number"
                value={variant.stockQuantity}
                onChange={(e) => updateVariant(vi, "stockQuantity", e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                label="Weight (g)"
                name={`variant-weight-${vi}`}
                type="number"
                value={variant.weight}
                onChange={(e) => updateVariant(vi, "weight", e.target.value)}
                placeholder="200"
              />
              <FormField
                label="Barcode"
                name={`variant-barcode-${vi}`}
                value={variant.barcode}
                onChange={(e) => updateVariant(vi, "barcode", e.target.value)}
                placeholder="123456789"
              />
              <FormField
                label="Low Stock Threshold"
                name={`variant-threshold-${vi}`}
                type="number"
                value={variant.lowStockThreshold}
                onChange={(e) => updateVariant(vi, "lowStockThreshold", e.target.value)}
                placeholder="5"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`allowBackorder-${vi}`}
                checked={variant.allowBackorder}
                onChange={(e) => updateVariant(vi, "allowBackorder", e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20"
              />
              <label htmlFor={`allowBackorder-${vi}`} className="text-sm text-slate-700">
                Allow backorder
              </label>
            </div>

            {/* Attributes */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Attributes</span>
                <button
                  type="button"
                  onClick={() => addAttribute(vi)}
                  className="text-xs text-primary hover:text-primary/80 font-medium"
                >
                  + Add Attribute
                </button>
              </div>

              {variant.attributes.length === 0 && (
                <p className="text-xs text-slate-400">No attributes yet. Add attributes like Color, Size, etc.</p>
              )}

              {variant.attributes.map((attr, ai) => (
                <div key={ai} className="flex items-end gap-2">
                  <div className="flex-1">
                    <FormField
                      label=""
                      name={`attr-name-${vi}-${ai}`}
                      value={attr.attributeName}
                      onChange={(e) => updateAttribute(vi, ai, "attributeName", e.target.value)}
                      placeholder="Name (e.g. Color)"
                    />
                  </div>
                  <div className="flex-1">
                    <FormField
                      label=""
                      name={`attr-value-${vi}-${ai}`}
                      value={attr.attributeValue}
                      onChange={(e) => updateAttribute(vi, ai, "attributeValue", e.target.value)}
                      placeholder="Value (e.g. Blue)"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttribute(vi, ai)}
                    className="h-10 px-2 text-rose-600 hover:text-rose-700 text-sm shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Settings */}
      {isEditing && (
        <div className="bg-white rounded-md border border-slate-200 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Settings</h3>
            <p className="text-xs text-slate-500 mt-1">Control visibility and status.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <select
                name="status"
                value={values.status}
                onChange={(e) => setField("status", e.target.value)}
                className={selectClass}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Visibility</label>
              <select
                name="isActive"
                value={values.isActive ? "true" : "false"}
                onChange={(e) => setField("isActive", e.target.value === "true")}
                className={selectClass}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div
            onClick={() => setField("isFeatured", !values.isFeatured)}
            className={`flex items-center gap-4 rounded-lg border-2 p-4 cursor-pointer transition-all ${
              values.isFeatured
                ? 'border-amber-400 bg-amber-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
              values.isFeatured ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-400'
            }`}>
              <svg className="h-5 w-5" fill={values.isFeatured ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${values.isFeatured ? 'text-amber-900' : 'text-slate-700'}`}>
                Featured Product
              </p>
              <p className="text-xs text-slate-500">
                Display this product on the homepage highlight section
              </p>
            </div>
            <div className={`relative h-6 w-11 rounded-full transition-colors ${values.isFeatured ? 'bg-amber-400' : 'bg-slate-200'}`}>
              <div className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${values.isFeatured ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </div>
        </div>
      )}

      {!isEditing && (
        <div
          onClick={() => setField("isFeatured", !values.isFeatured)}
          className={`flex items-center gap-4 rounded-lg border-2 p-4 cursor-pointer transition-all ${
            values.isFeatured
              ? 'border-amber-400 bg-amber-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
            values.isFeatured ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-400'
          }`}>
            <svg className="h-5 w-5" fill={values.isFeatured ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className={`text-sm font-semibold ${values.isFeatured ? 'text-amber-900' : 'text-slate-700'}`}>
              Featured Product
            </p>
            <p className="text-xs text-slate-500">
              Display this product on the homepage highlight section
            </p>
          </div>
          <div className={`relative h-6 w-11 rounded-full transition-colors ${values.isFeatured ? 'bg-amber-400' : 'bg-slate-200'}`}>
            <div className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${values.isFeatured ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
        </div>
      )}

      {/* Product Images */}
      <div className="bg-white rounded-md border border-slate-200 shadow-xs p-6 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Product Images</h3>
          <p className="text-xs text-slate-500 mt-1">Upload one or more product images.</p>
        </div>

        <FileUploadMultiple
          defaultImages={values.images}
          onSuccess={(newImages) =>
            setField("images", newImages.map((img, i) => ({
              ...img,
              isPrimary: i === 0,
            })))
          }
          folder="products"
          maxFiles={10}
          showPreview={false}
        />

        {values.images.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {values.images.map((img, index) => (
              <div
                key={`${img.key}-${index}`}
                className={`relative h-24 w-full overflow-hidden rounded-md border-2 ${img.isPrimary ? 'border-primary' : 'border-slate-200'}`}
              >
                <img
                  src={img.url}
                  alt={`Product image ${index + 1}`}
                  className="h-full w-full object-contain"
                />
                <button
                  type="button"
                  onClick={() =>
                    setField(
                      "images",
                      values.images.map((item, i) => ({ ...item, isPrimary: i === index })),
                    )
                  }
                  className={`absolute left-1 top-1 rounded px-1.5 py-0.5 text-xs ${img.isPrimary ? 'bg-primary text-white' : 'bg-black/60 text-white hover:bg-black/80'}`}
                >
                  {img.isPrimary ? '★' : '☆'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setField(
                      "images",
                      values.images.filter((_, i) => i !== index),
                    )
                  }
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white hover:bg-black/80"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <PrimaryButton
          type="submit"
          text={isEditing ? "Update Product" : "Create Product"}
          disabled={isPending}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
