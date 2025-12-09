import { useState, useEffect, useRef } from 'react'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import type { Manufacturer } from '@/lib/types'
import type { ProductVariant } from '@/lib/types/product-variant'
import type { UpdateProductInput } from '@/lib/server/products/types';
import { Input } from '@/components/Input'
import { FieldInfo } from '@/components/FieldInfo'
import Heading from '@/components/Heading'
import Button from '@/components/Button'
import { NotificationsList, useNotifications } from '@/components/notifications/Notification';
import { getProductById, updateProduct } from '@/lib/server/products/server-fns'
import { getAllCategories } from '@/lib/server/categories/server-fns'
import { updateProductSchema } from '@/lib/server/products/types'
import { listManufacturers } from '@/lib/server/manufacturer/list'
import { listProductVariantsByProduct } from '@/lib/server/product-variant/list-by-product'
import { createProductVariant, CreateProductVariantInput } from '@/lib/server/product-variant/create'
import { updateProductVariant, UpdateProductVariantData } from '@/lib/server/product-variant/update'
import { deleteProductVariant } from '@/lib/server/product-variant/delete'
import { createProductSku } from '@/lib/server/product-variant/sku'

export const Route = createFileRoute('/admin/products/$productId')({
  loader: async ({ params }) => {
    const categories = await getAllCategories()
    const manufacturers = await listManufacturers({ data: {} })
    const productResult = await getProductById({ data: { id: params.productId } })

    if ('error' in productResult) {
      throw new Error(productResult.message || 'Failed to load product')
    }

    const productVariantsResult = productResult.data
      ? await listProductVariantsByProduct({ data: { product_id: params.productId } })
      : { status: 'ERROR' as const, error: 'Product not found' };

    return {
      categories,
      product: productResult.data,
      manufacturers,
      productVariants: productVariantsResult,
    }
  },
  component: RouteComponent,
})

const columnHelper = createColumnHelper<ProductVariant>();

function getProductVariantColumns(
  onOpenEditDialog: (variant: ProductVariant) => void,
  onOpenDeleteDialog: (variantId: string) => void,
) {
  return [
    columnHelper.accessor('name', {
      header: 'Variant Name',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('sku', {
      header: 'SKU',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('default_sell_price', {
      header: 'Sell Price',
      cell: info => {
        const value = info.getValue();
        return value ? `${(value).toFixed(2)}` : 'N/A';
      },
    }),
    columnHelper.accessor('image', {
      header: 'Image',
      cell: info => info.getValue() ? 'Yes' : 'No',
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: info => (
        <div className="flex gap-2">
          <Button
            variant='primary'
            onClick={() => onOpenEditDialog(info.row.original)}
          >
            Edit
          </Button>
          <Button
            variant='error'
            onClick={() => onOpenDeleteDialog(info.row.original.id)}
          >
            Delete
          </Button>
        </div>
      ),
    }),
  ];
}

function RouteComponent() {
  const loaderData = Route.useLoaderData()
  const product = loaderData.product
  const categories = loaderData.categories
  const manufacturers = loaderData.manufacturers
  const initialProductVariants = loaderData.productVariants.status === 'SUCCESS'
    ? loaderData.productVariants.data
    : [];

  const [manufacturerData] = useState<Array<Manufacturer>>(() =>
    manufacturers.status === 'SUCCESS' ? manufacturers.data.items : [],
  )
  const [productVariants, setProductVariants] = useState<ProductVariant[]>(initialProductVariants);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedVariantIdToDelete, setSelectedVariantIdToDelete] = useState<string | null>(null);

  const navigate = useNavigate()
  const router = useRouter();
  const notifications = useNotifications();

  const addDialogRef = useRef<HTMLDialogElement>(null);
  const editDialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isGeneratingAddSku, setIsGeneratingAddSku] = useState(false);
  const [isGeneratingEditSku, setIsGeneratingEditSku] = useState(false);

  // Sync product variants when loader data changes
  useEffect(() => {
    if (loaderData.productVariants.status === 'SUCCESS') {
      setProductVariants(loaderData.productVariants.data);
    }
  }, [loaderData.productVariants]);

  const defaultValues: UpdateProductInput = {
    id: product?.id || '',
    name: product?.name || '',
    description: product?.description || '',
    category_id: product?.category_id || '',
    brand: product?.brand || '',
    default_sell_price: product?.default_sell_price || 0,
    manufacturer: product?.manufacturer || '',
  }

  // Product form
  const productForm = useForm({
    defaultValues: defaultValues,
    validators: { onChange: updateProductSchema },
    onSubmit: async ({ value }) => {
      notifications.clear();

      return updateProduct({ data: value }).then((result) => {
        if ('error' in result) {
          notifications.addNotification({
            message: result.message || 'An error occurred while updating the product.',
            type: 'ERROR',
          });
        } else {
          notifications.addNotification({
            message: 'Product updated successfully.',
            type: 'SUCCESS',
          });
          router.invalidate();
        }
      }).catch((error) => {
        notifications.addNotification({
          message: error.message || 'An unexpected error occurred.',
          type: 'ERROR',
        });
      });
    },
  })

  // Add product variant form
  const addVariantForm = useForm({
    defaultValues: {
      product_id: product?.id || '',
      name: '',
      sku: '',
      default_sell_price: 0,
      productImage: '',
    },
    validators: {
      onChange: CreateProductVariantInput,
    },
    listeners: {
      onChangeDebounceMs: 500,
      onChange: ({ fieldApi }) => {
        if (fieldApi.name === 'name') {
          if (fieldApi.form.getFieldValue('product_id') && fieldApi.form.getFieldValue('name')) {
            setIsGeneratingAddSku(true);
            createProductSku({
              data: {
                product_id: fieldApi.form.getFieldValue('product_id'),
                variant_name: fieldApi.form.getFieldValue('name'),
              },
            }).then((result) => {
              if (result.status === 'SUCCESS') {
                addVariantForm.setFieldValue('sku', result.data.sku);
              } else {
                notifications.addNotification({
                  message: result.error || 'An error occurred while generating the SKU.',
                  type: 'ERROR',
                });
              }
            }).finally(() => {
              setIsGeneratingAddSku(false);
            });
          }
        }
      }
    },
    onSubmit: async (values) => {
      setSubmitting(true);
      notifications.clear();

      return createProductVariant({
        data: values.value,
      }).then((result) => {
        if (result.status === 'SUCCESS') {
          notifications.addNotification({
            message: 'Product variant added successfully.',
            type: 'SUCCESS',
          });
          addVariantForm.reset();
          addDialogRef.current?.close();
          router.invalidate();
        } else {
          notifications.addNotification({
            message: result.error || 'An error occurred while adding the product variant.',
            type: 'ERROR',
          });
        }
      }).catch((error) => {
        notifications.addNotification({
          message: error.message || 'An unexpected error occurred.',
          type: 'ERROR',
        });
      }).finally(() => {
        setSubmitting(false);
      });
    },
  });

  // Edit product variant form
  const editVariantForm = useForm({
    defaultValues: {
      productVariantId: selectedVariant?.id || '',
      product_id: selectedVariant?.product_id || '',
      name: selectedVariant?.name || '',
      sku: selectedVariant?.sku || '',
      default_sell_price: selectedVariant?.default_sell_price || 0,
      productImage: '',
    },
    validators: {
      onChange: UpdateProductVariantData,
    },
    listeners: {
      onChangeDebounceMs: 500,
      onChange: ({ fieldApi }) => {
        if (fieldApi.name === 'name') {
          if (fieldApi.form.getFieldValue('product_id') && fieldApi.form.getFieldValue('name')) {
            setIsGeneratingEditSku(true);
            createProductSku({
              data: {
                product_id: fieldApi.form.getFieldValue('product_id'),
                variant_name: fieldApi.form.getFieldValue('name'),
              },
            }).then((result) => {
              if (result.status === 'SUCCESS') {
                editVariantForm.setFieldValue('sku', result.data.sku);
              } else {
                notifications.addNotification({
                  message: result.error || 'An error occurred while generating the SKU.',
                  type: 'ERROR',
                });
              }
            }).finally(() => {
              setIsGeneratingEditSku(false);
            });
          }
        }
      }
    },
    onSubmit: async (values) => {
      setSubmitting(true);
      notifications.clear();

      return updateProductVariant({
        data: values.value,
      }).then((result) => {
        if (result.status === 'SUCCESS') {
          notifications.addNotification({
            message: 'Product variant updated successfully.',
            type: 'SUCCESS',
          });
          editDialogRef.current?.close();
          router.invalidate();
        } else {
          notifications.addNotification({
            message: result.error || 'An error occurred while updating the product variant.',
            type: 'ERROR',
          });
        }
      }).catch((error) => {
        notifications.addNotification({
          message: error.message || 'An unexpected error occurred.',
          type: 'ERROR',
        });
      }).finally(() => {
        setSubmitting(false);
      });
    },
  });

  // Update edit form when selected variant changes
  useEffect(() => {
    if (selectedVariant) {
      editVariantForm.setFieldValue('productVariantId', selectedVariant.id);
      editVariantForm.setFieldValue('product_id', selectedVariant.product_id);
      editVariantForm.setFieldValue('name', selectedVariant.name);
      editVariantForm.setFieldValue('sku', selectedVariant.sku);
      editVariantForm.setFieldValue('default_sell_price', selectedVariant.default_sell_price || 0);
      editVariantForm.setFieldValue('productImage', '');
    }
  }, [selectedVariant]);

  const handleDeleteVariant = async (variantId: string) => {
    setDeleting(true);
    notifications.clear();

    deleteProductVariant({ data: { productVariantId: variantId } }).then((result) => {
      if (result.status === 'SUCCESS') {
        notifications.addNotification({
          message: 'Product variant deleted successfully.',
          type: 'SUCCESS',
        });
        deleteDialogRef.current?.close();
        router.invalidate();
      } else {
        notifications.addNotification({
          message: result.error || 'An error occurred while deleting the product variant.',
          type: 'ERROR',
        });
      }
    }).catch((error) => {
      notifications.addNotification({
        message: error.message || 'An unexpected error occurred.',
        type: 'ERROR',
      });
    }).finally(() => {
      setDeleting(false);
    });
  };

  const openEditDialog = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    editDialogRef.current?.showModal();
  };

  const openDeleteDialog = (variantId: string) => {
    setSelectedVariantIdToDelete(variantId);
    deleteDialogRef.current?.showModal();
  };

  const columns = getProductVariantColumns(openEditDialog, openDeleteDialog);
  const table = useReactTable({
    data: productVariants,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!product) {
    return <Heading level={2}>Product not found</Heading>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <NotificationsList />

      <Heading level={2} className='mt-12 mb-4'>
        Edit Product
      </Heading>

      {/* Product Edit Form */}
      <form
        className='mt-8 w-full max-w-md space-y-4'
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          productForm.handleSubmit();
        }}
      >
        <div>
          <productForm.Field
            name="name"
            children={(field) => (
              <>
                <Input
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Product Name"
                  hasError={field.state.meta.isTouched && !field.state.meta.isValid}
                />
                <FieldInfo field={field} />
              </>
            )}
          />
        </div>

        <div className="mt-2">
          <productForm.Field
            name="description"
            children={(field) => (
              <>
                <Input
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Description (optional)"
                  hasError={field.state.meta.isTouched && !field.state.meta.isValid}
                />
                <FieldInfo field={field} />
              </>
            )}
          />
        </div>

        <div className="mt-4">
          <productForm.Field
            name="category_id"
            children={(field) => (
              <>
                <select
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full input"
                >
                  <option value="">Select Category</option>
                  {categories.data?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <FieldInfo field={field} />
              </>
            )}
          />
        </div>

        <div className="mt-2">
          <productForm.Field
            name="brand"
            children={(field) => (
              <>
                <Input
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Brand (optional)"
                  hasError={field.state.meta.isTouched && !field.state.meta.isValid}
                />
                <FieldInfo field={field} />
              </>
            )}
          />
        </div>

        <div className="mt-2">
          <productForm.Field
            name="default_sell_price"
            children={(field) => (
              <>
                <Input
                  type="number"
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => {
                    field.handleChange(e.target.valueAsNumber)
                  }}
                  placeholder="Default Sell Price"
                  hasError={field.state.meta.isTouched && !field.state.meta.isValid}
                />
                <FieldInfo field={field} />
              </>
            )}
          />
        </div>

        <div className="mt-4">
          <productForm.Field
            name="manufacturer"
            children={(field) => (
              <>
                <select
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full input"
                >
                  <option value="">Select Manufacturer (optional)</option>
                  {manufacturerData.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <FieldInfo field={field} />
              </>
            )}
          />
        </div>

        <div className='flex flex-row justify-between mt-8'>
          <button
            type='button'
            className='btn btn-neutral'
            onClick={() => navigate({ to: '/admin/products' })}
          >
            Back to Products
          </button>
          <productForm.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button
                type='submit'
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Save Changes'}
              </Button>
            )}
          />
        </div>
      </form>

      {/* Product Variants Section */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-4">
          <Heading level={3}>Product Variants</Heading>
          <Button
            variant="primary"
            onClick={() => {
              notifications.clear();
              addDialogRef.current?.showModal();
            }}
          >
            Add Product Variant
          </Button>
        </div>

        {/* Product Variants Table */}
        <div className="w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header.isPlaceholder ? null : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Variant Modal */}
      <dialog ref={addDialogRef} className="modal">
        <div className="modal-box max-w-2xl">
          <form method="dialog">
            <button disabled={submitting} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <h3 className="font-bold text-lg mb-4">Add Product Variant</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addVariantForm.handleSubmit();
            }}
            className="space-y-4"
          >
            <addVariantForm.Field
              name="name"
              children={(field) => (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Variant Name</label>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g., 50ml Bottle"
                    hasError={field.state.meta.isTouched && !field.state.meta.isValid}
                  />
                  <FieldInfo field={field} />
                </>
              )}
            />
            <addVariantForm.Field
              name="sku"
              children={(field) => (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU
                    {isGeneratingAddSku && <span className="text-xs text-gray-500 ml-2">(Generating...)</span>}
                  </label>
                  <Input
                    value={field.state.value}
                    readOnly
                    placeholder="Auto-generated from product and variant"
                    hasError={field.state.meta.isTouched && !field.state.meta.isValid}
                    className="bg-gray-50 cursor-not-allowed"
                  />
                  <FieldInfo field={field} />
                  <p className="text-xs text-gray-500 mt-1">SKU is automatically generated from product and variant name</p>
                </>
              )}
            />
            <addVariantForm.Field
              name="default_sell_price"
              children={(field) => (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Sell Price</label>
                  <Input
                    type="number"
                    min="0"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(parseInt(e.target.value))}
                    hasError={field.state.meta.isTouched && !field.state.meta.isValid}
                  />
                  <FieldInfo field={field} />
                </>
              )}
            />
            <addVariantForm.Field
              name="productImage"
              children={(field) => (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Image (optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="file-input file-input-bordered w-full"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          field.handleChange(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {field.state.value && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">Preview:</p>
                      <img
                        src={field.state.value}
                        alt="Product variant preview"
                        className="max-w-xs max-h-48 rounded border border-gray-300"
                      />
                    </div>
                  )}
                  <FieldInfo field={field} />
                </>
              )}
            />
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-neutral"
                disabled={submitting}
                onClick={() => addDialogRef.current?.close()}
              >
                Cancel
              </button>
              <addVariantForm.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    disabled={!canSubmit || isSubmitting || submitting}
                  >
                    {submitting ? 'Adding...' : 'Add Variant'}
                  </Button>
                )}
              />
            </div>
          </form>
        </div>
      </dialog>

      {/* Edit Product Variant Modal */}
      <dialog ref={editDialogRef} className="modal">
        <div className="modal-box max-w-2xl">
          <form method="dialog">
            <button disabled={submitting} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <h3 className="font-bold text-lg mb-4">Edit Product Variant</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              editVariantForm.handleSubmit();
            }}
            className="space-y-4"
          >
            <editVariantForm.Field
              name="name"
              children={(field) => (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Variant Name</label>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g., 50ml Bottle"
                    hasError={field.state.meta.isTouched && !field.state.meta.isValid}
                  />
                  <FieldInfo field={field} />
                </>
              )}
            />
            <editVariantForm.Field
              name="sku"
              children={(field) => (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU
                    {isGeneratingEditSku && <span className="text-xs text-gray-500 ml-2">(Generating...)</span>}
                  </label>
                  <Input
                    value={field.state.value}
                    readOnly
                    placeholder="Auto-generated from product and variant"
                    hasError={field.state.meta.isTouched && !field.state.meta.isValid}
                    className="bg-gray-50 cursor-not-allowed"
                  />
                  <FieldInfo field={field} />
                  <p className="text-xs text-gray-500 mt-1">SKU is automatically generated from product and variant name</p>
                </>
              )}
            />
            <editVariantForm.Field
              name="default_sell_price"
              children={(field) => (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Sell Price</label>
                  <Input
                    type="number"
                    min="0"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(parseInt(e.target.value))}
                    hasError={field.state.meta.isTouched && !field.state.meta.isValid}
                  />
                  <FieldInfo field={field} />
                </>
              )}
            />
            <editVariantForm.Field
              name="productImage"
              children={(field) => (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Image (optional - upload to replace)</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="file-input file-input-bordered w-full"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          field.handleChange(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {(field.state.value || selectedVariant?.image) && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">
                        {field.state.value ? 'New Image Preview:' : 'Current Image:'}
                      </p>
                      <img
                        src={field.state.value || selectedVariant?.image || ''}
                        alt="Product variant preview"
                        className="max-w-xs max-h-48 rounded border border-gray-300"
                      />
                    </div>
                  )}
                  <FieldInfo field={field} />
                </>
              )}
            />
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-neutral"
                disabled={submitting}
                onClick={() => editDialogRef.current?.close()}
              >
                Cancel
              </button>
              <editVariantForm.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    disabled={!canSubmit || isSubmitting || submitting}
                  >
                    {submitting ? 'Updating...' : 'Update Variant'}
                  </Button>
                )}
              />
            </div>
          </form>
        </div>
      </dialog>

      {/* Delete Confirmation Modal */}
      <dialog ref={deleteDialogRef} className="modal">
        <div className="modal-box">
          <form method="dialog">
            <button disabled={deleting} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <p className="font-bold text-lg">Are you sure you want to delete this product variant?</p>
          <p className="text-sm text-gray-600 mt-2">This action cannot be undone.</p>
          <div className="modal-action">
            <Button
              disabled={deleting}
              variant="neutral"
              onClick={() => deleteDialogRef.current?.close()}
            >
              Cancel
            </Button>
            <Button
              disabled={deleting}
              variant="error"
              onClick={() => {
                if (selectedVariantIdToDelete) {
                  handleDeleteVariant(selectedVariantIdToDelete);
                }
              }}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  )
}
