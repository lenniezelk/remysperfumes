import { useForm } from '@tanstack/react-form'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useEffect, useRef, useState } from 'react'
import Button from '@/components/Button'
import { FieldInfo } from '@/components/FieldInfo'
import Heading from '@/components/Heading'
import { Input } from '@/components/Input'
import {
  NotificationsList,
  useNotifications,
} from '@/components/notifications/Notification'
import { getSale } from '@/lib/server/sales/get'
import { updateSaleData, updateSale } from '@/lib/server/sales/update'
import { listSaleItemsBySale } from '@/lib/server/sale-item/list-by-sale'
import {
  createSaleItem,
  CreateSaleItemInput,
} from '@/lib/server/sale-item/create'
import {
  updateSaleItem,
  UpdateSaleItemData,
} from '@/lib/server/sale-item/update'
import { deleteSaleItem } from '@/lib/server/sale-item/delete'
import { listProductVariants } from '@/lib/server/product-variant/list'
import { listStockBatches } from '@/lib/server/stock-batch/list'

export const Route = createFileRoute('/admin/sales/$saleId')({
  component: RouteComponent,
  loader: async (ctx) => {
    const saleResult = await getSale({ data: { saleId: ctx.params.saleId } })
    const saleItemsResult =
      saleResult.status === 'SUCCESS'
        ? await listSaleItemsBySale({ data: { sale_id: ctx.params.saleId } })
        : { status: 'ERROR' as const, error: 'Sale not found' }
    const productVariantsResult = await listProductVariants()
    const stockBatchesResult = await listStockBatches()

    return {
      sale: saleResult,
      saleItems: saleItemsResult,
      productVariants: productVariantsResult,
      stockBatches: stockBatchesResult,
    }
  },
})

type SaleItem = typeof import('@/lib/db/schema').saleItemTable.$inferSelect

const columnHelper = createColumnHelper<SaleItem>()

function getSaleItemColumns(
  onOpenEditDialog: (saleItem: SaleItem) => void,
  onOpenDeleteDialog: (saleItemId: string) => void,
  productVariants: any[],
) {
  return [
    columnHelper.accessor('product_variant_id', {
      header: 'Product Variant',
      cell: (info) => {
        const variant = productVariants.find((v) => v.id === info.getValue())
        return variant
          ? `${variant.name} (${variant.sku})`
          : info.getValue().substring(0, 8) + '...'
      },
    }),
    columnHelper.accessor('quantity_sold', {
      header: 'Quantity',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('price_at_sale', {
      header: 'Price',
      cell: (info) => `${info.getValue().toFixed(2)}`,
    }),
    columnHelper.accessor('cost_at_sale', {
      header: 'Cost',
      cell: (info) => `${info.getValue().toFixed(2)}`,
    }),
    columnHelper.display({
      id: 'subtotal',
      header: 'Subtotal',
      cell: (info) => {
        const quantity = info.row.original.quantity_sold
        const price = info.row.original.price_at_sale
        return `${(quantity * price).toFixed(2)}`
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={() => onOpenEditDialog(info.row.original)}
          >
            Edit
          </Button>
          <Button
            variant="error"
            onClick={() => onOpenDeleteDialog(info.row.original.id)}
          >
            Delete
          </Button>
        </div>
      ),
    }),
  ]
}

function RouteComponent() {
  const loaderData = Route.useLoaderData()
  const sale =
    loaderData.sale.status === 'SUCCESS' ? loaderData.sale.data : null
  const initialSaleItems =
    loaderData.saleItems.status === 'SUCCESS' ? loaderData.saleItems.data : []
  const productVariants =
    loaderData.productVariants.status === 'SUCCESS'
      ? loaderData.productVariants.data
      : []
  const stockBatches =
    loaderData.stockBatches.status === 'SUCCESS'
      ? loaderData.stockBatches.data
      : []

  const [saleItems, setSaleItems] = useState<SaleItem[]>(initialSaleItems)
  const [selectedSaleItem, setSelectedSaleItem] = useState<SaleItem | null>(
    null,
  )
  const [selectedSaleItemIdToDelete, setSelectedSaleItemIdToDelete] = useState<
    string | null
  >(null)

  const notifications = useNotifications()
  const navigate = useNavigate()
  const router = useRouter()

  const addDialogRef = useRef<HTMLDialogElement>(null)
  const editDialogRef = useRef<HTMLDialogElement>(null)
  const deleteDialogRef = useRef<HTMLDialogElement>(null)

  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Sync sale items when loader data changes
  useEffect(() => {
    if (loaderData.saleItems.status === 'SUCCESS') {
      setSaleItems(loaderData.saleItems.data)
    }
  }, [loaderData.saleItems])

  const saleForm = useForm({
    defaultValues: {
      saleId: sale ? sale.id : '',
      date: sale ? new Date(sale.date) : new Date(),
      total_amount: sale ? sale.total_amount : 0,
      customer_name: sale ? sale.customer_name : '',
      customer_contact: sale ? sale.customer_contact : '',
      restore_sale: false,
    },
    validators: {
      onChange: updateSaleData,
    },
    onSubmit: async (values) => {
      const data = {
        saleId: values.value.saleId,
        date: values.value.date,
        total_amount: values.value.total_amount,
        customer_name: values.value.customer_name || '',
        customer_contact: values.value.customer_contact || '',
        restore_sale: values.value.restore_sale,
      }

      notifications.clear()

      return updateSale({
        data,
      })
        .then((result) => {
          if (result.status === 'SUCCESS') {
            notifications.addNotification({
              message: 'Sale updated successfully.',
              type: 'SUCCESS',
            })
            router.invalidate()
          } else {
            notifications.addNotification({
              message:
                result.error || 'An error occurred while updating the sale.',
              type: 'ERROR',
            })
          }
        })
        .catch((error) => {
          notifications.addNotification({
            message: error.message || 'An unexpected error occurred.',
            type: 'ERROR',
          })
        })
    },
  })

  const addSaleItemForm = useForm({
    defaultValues: {
      sale_id: sale?.id || '',
      product_variant_id: '',
      quantity_sold: 1,
      price_at_sale: 0,
    },
    validators: {
      onChange: CreateSaleItemInput,
    },
    onSubmit: async (values) => {
      setSubmitting(true)
      notifications.clear()

      return createSaleItem({
        data: values.value,
      })
        .then((result) => {
          if (result.status === 'SUCCESS') {
            notifications.addNotification({
              message: 'Sale item added successfully.',
              type: 'SUCCESS',
            })

            // Check if any batches were exhausted
            if (result.exhaustedBatches && result.exhaustedBatches.length > 0) {
              notifications.addNotification({
                message: `Warning: ${result.exhaustedBatches.length} stock batch${result.exhaustedBatches.length > 1 ? 'es' : ''} now empty. Consider restocking soon.`,
                type: 'WARNING',
              })
            }

            addSaleItemForm.reset()
            addDialogRef.current?.close()
            router.invalidate()
          } else {
            notifications.addNotification({
              message:
                result.error || 'An error occurred while adding the sale item.',
              type: 'ERROR',
            })
          }
        })
        .catch((error) => {
          notifications.addNotification({
            message: error.message || 'An unexpected error occurred.',
            type: 'ERROR',
          })
        })
        .finally(() => {
          setSubmitting(false)
        })
    },
  })

  const editSaleItemForm = useForm({
    defaultValues: {
      saleItemId: selectedSaleItem?.id || '',
      sale_id: selectedSaleItem?.sale_id || '',
      product_variant_id: selectedSaleItem?.product_variant_id || '',
      quantity_sold: selectedSaleItem?.quantity_sold || 1,
      price_at_sale: selectedSaleItem?.price_at_sale || 0,
    },
    validators: {
      onChange: UpdateSaleItemData,
    },
    onSubmit: async (values) => {
      setSubmitting(true)
      notifications.clear()

      return updateSaleItem({
        data: values.value,
      })
        .then((result) => {
          if (result.status === 'SUCCESS') {
            notifications.addNotification({
              message: 'Sale item updated successfully.',
              type: 'SUCCESS',
            })

            // Check if any batches were exhausted
            if (result.exhaustedBatches && result.exhaustedBatches.length > 0) {
              notifications.addNotification({
                message: `Warning: ${result.exhaustedBatches.length} stock batch${result.exhaustedBatches.length > 1 ? 'es' : ''} now empty. Consider restocking soon.`,
                type: 'WARNING',
              })
            }

            editDialogRef.current?.close()
            router.invalidate()
          } else {
            notifications.addNotification({
              message:
                result.error ||
                'An error occurred while updating the sale item.',
              type: 'ERROR',
            })
          }
        })
        .catch((error) => {
          notifications.addNotification({
            message: error.message || 'An unexpected error occurred.',
            type: 'ERROR',
          })
        })
        .finally(() => {
          setSubmitting(false)
        })
    },
  })

  // Update edit form when selected item changes
  useEffect(() => {
    if (selectedSaleItem) {
      editSaleItemForm.setFieldValue('saleItemId', selectedSaleItem.id)
      editSaleItemForm.setFieldValue('sale_id', selectedSaleItem.sale_id)
      editSaleItemForm.setFieldValue(
        'product_variant_id',
        selectedSaleItem.product_variant_id,
      )
      editSaleItemForm.setFieldValue(
        'quantity_sold',
        selectedSaleItem.quantity_sold,
      )
      editSaleItemForm.setFieldValue(
        'price_at_sale',
        selectedSaleItem.price_at_sale,
      )
    }
  }, [selectedSaleItem])

  const handleDeleteSaleItem = async (saleItemId: string) => {
    setDeleting(true)
    notifications.clear()

    deleteSaleItem({ data: { saleItemId } })
      .then((result) => {
        if (result.status === 'SUCCESS') {
          notifications.addNotification({
            message: 'Sale item deleted successfully.',
            type: 'SUCCESS',
          })
          deleteDialogRef.current?.close()
          router.invalidate()
        } else {
          notifications.addNotification({
            message:
              result.error || 'An error occurred while deleting the sale item.',
            type: 'ERROR',
          })
        }
      })
      .catch((error) => {
        notifications.addNotification({
          message: error.message || 'An unexpected error occurred.',
          type: 'ERROR',
        })
      })
      .finally(() => {
        setDeleting(false)
      })
  }

  const openEditDialog = (saleItem: SaleItem) => {
    setSelectedSaleItem(saleItem)
    editDialogRef.current?.showModal()
  }

  const openDeleteDialog = (saleItemId: string) => {
    setSelectedSaleItemIdToDelete(saleItemId)
    deleteDialogRef.current?.showModal()
  }

  const columns = getSaleItemColumns(
    openEditDialog,
    openDeleteDialog,
    productVariants,
  )
  const table = useReactTable({
    data: saleItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const calculateTotal = () => {
    return saleItems.reduce(
      (sum, item) => sum + item.quantity_sold * item.price_at_sale,
      0,
    )
  }

  if (!sale) {
    return <Heading level={2}>Sale not found</Heading>
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <NotificationsList />
      <Heading level={2} className="mt-12 mb-4">
        Edit Sale
      </Heading>

      {/* Sale Edit Form */}
      <form
        className="mt-8 w-full max-w-md space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          saleForm.handleSubmit()
        }}
      >
        <div>
          <saleForm.Field
            name="date"
            children={(field) => (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sale Date
                </label>
                <Input
                  type="date"
                  name={field.name}
                  value={
                    field.state.value instanceof Date
                      ? field.state.value.toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) => field.handleChange(new Date(e.target.value))}
                  hasError={
                    field.state.meta.isTouched && !field.state.meta.isValid
                  }
                />
                <FieldInfo field={field} />
              </>
            )}
          />
        </div>
        <div className="mt-2">
          <saleForm.Field
            name="customer_name"
            children={(field) => (
              <>
                <Input
                  name={field.name}
                  value={field.state.value || ''}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter Customer Name"
                  hasError={
                    field.state.meta.isTouched && !field.state.meta.isValid
                  }
                />
                <FieldInfo field={field} />
              </>
            )}
          />
        </div>
        <div className="mt-2">
          <saleForm.Field
            name="customer_contact"
            children={(field) => (
              <>
                <Input
                  name={field.name}
                  value={field.state.value || ''}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter Customer Contact"
                  hasError={
                    field.state.meta.isTouched && !field.state.meta.isValid
                  }
                />
                <FieldInfo field={field} />
              </>
            )}
          />
        </div>
        <div className="mt-2">
          <saleForm.Field
            name="total_amount"
            children={(field) => (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Amount
                </label>
                <Input
                  type="number"
                  name={field.name}
                  value={calculateTotal()}
                  disabled
                  hasError={
                    field.state.meta.isTouched && !field.state.meta.isValid
                  }
                />
                <FieldInfo field={field} />
              </>
            )}
          />
        </div>
        {sale?.deleted_at !== null && (
          <div className="mt-2">
            <saleForm.Field
              name="restore_sale"
              children={(field) => (
                <>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name={field.name}
                      checked={field.state.value}
                      onChange={(e) => field.handleChange(e.target.checked)}
                      className="checkbox"
                    />
                    <span>Restore Sale?</span>
                  </label>
                  <FieldInfo field={field} />
                </>
              )}
            />
          </div>
        )}
        <div className="flex flex-row justify-between mt-8">
          <button
            type="button"
            className="btn btn-neutral"
            onClick={() => navigate({ to: '/admin/sales' })}
          >
            Back to Sales
          </button>
          <saleForm.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Save Changes'}
              </Button>
            )}
          />
        </div>
      </form>

      {/* Sale Items Section */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-4">
          <Heading level={3}>Sale Items</Heading>
          {sale?.deleted_at ? (
            <div
              className="tooltip tooltip-left"
              data-tip="Cannot add sale items to a deleted sale. Please restore the sale first."
            >
              <Button variant="primary" disabled>
                Add Sale Item
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              onClick={() => {
                notifications.clear()
                addDialogRef.current?.showModal()
              }}
            >
              Add Sale Item
            </Button>
          )}
        </div>

        {/* Sale Items Table */}
        <div className="w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={4} className="px-6 py-4 text-right font-bold">
                  Total:
                </td>
                <td className="px-6 py-4 font-bold">
                  {calculateTotal().toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Add Sale Item Modal */}
      <dialog ref={addDialogRef} className="modal">
        <div className="modal-box max-w-2xl">
          <form method="dialog">
            <button
              disabled={submitting}
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            >
              ✕
            </button>
          </form>
          <h3 className="font-bold text-lg mb-4">Add Sale Item</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              addSaleItemForm.handleSubmit()
            }}
            className="space-y-4"
          >
            <addSaleItemForm.Field
              name="product_variant_id"
              children={(field) => (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Variant
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  >
                    <option value="">Select a product variant</option>
                    {productVariants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.name} ({variant.sku})
                      </option>
                    ))}
                  </select>
                  <FieldInfo field={field} />
                </>
              )}
            />
            <addSaleItemForm.Field
              name="quantity_sold"
              children={(field) => (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={field.state.value}
                    onChange={(e) =>
                      field.handleChange(parseInt(e.target.value))
                    }
                    hasError={
                      field.state.meta.isTouched && !field.state.meta.isValid
                    }
                  />
                  <FieldInfo field={field} />
                </>
              )}
            />
            <addSaleItemForm.Field
              name="price_at_sale"
              children={(field) => (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={field.state.value}
                    onChange={(e) =>
                      field.handleChange(parseInt(e.target.value))
                    }
                    hasError={
                      field.state.meta.isTouched && !field.state.meta.isValid
                    }
                  />
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
              <addSaleItemForm.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    disabled={!canSubmit || isSubmitting || submitting}
                  >
                    {submitting ? 'Adding...' : 'Add Item'}
                  </Button>
                )}
              />
            </div>
          </form>
        </div>
      </dialog>

      {/* Edit Sale Item Modal */}
      <dialog ref={editDialogRef} className="modal">
        <div className="modal-box max-w-2xl">
          <form method="dialog">
            <button
              disabled={submitting}
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            >
              ✕
            </button>
          </form>
          <h3 className="font-bold text-lg mb-4">Edit Sale Item</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              editSaleItemForm.handleSubmit()
            }}
            className="space-y-4"
          >
            <editSaleItemForm.Field
              name="product_variant_id"
              children={(field) => (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Variant
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  >
                    <option value="">Select a product variant</option>
                    {productVariants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.name} ({variant.sku})
                      </option>
                    ))}
                  </select>
                  <FieldInfo field={field} />
                </>
              )}
            />
            <editSaleItemForm.Field
              name="quantity_sold"
              children={(field) => (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={field.state.value}
                    onChange={(e) =>
                      field.handleChange(parseInt(e.target.value))
                    }
                    hasError={
                      field.state.meta.isTouched && !field.state.meta.isValid
                    }
                  />
                  <FieldInfo field={field} />
                </>
              )}
            />
            <editSaleItemForm.Field
              name="price_at_sale"
              children={(field) => (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={field.state.value}
                    onChange={(e) =>
                      field.handleChange(parseInt(e.target.value))
                    }
                    hasError={
                      field.state.meta.isTouched && !field.state.meta.isValid
                    }
                  />
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
              <editSaleItemForm.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    disabled={!canSubmit || isSubmitting || submitting}
                  >
                    {submitting ? 'Updating...' : 'Update Item'}
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
            <button
              disabled={deleting}
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            >
              ✕
            </button>
          </form>
          <p className="font-bold text-lg">
            Are you sure you want to delete this sale item?
          </p>
          <p className="text-sm text-gray-600 mt-2">
            This will restore the quantity to the stock batch.
          </p>
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
                if (selectedSaleItemIdToDelete) {
                  handleDeleteSaleItem(selectedSaleItemIdToDelete)
                }
              }}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  )
}
