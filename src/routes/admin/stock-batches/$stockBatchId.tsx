import { useForm } from '@tanstack/react-form';
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import Button from '@/components/Button';
import { FieldInfo } from '@/components/FieldInfo';
import Heading from '@/components/Heading';
import { Input } from '@/components/Input';
import { useNotifications } from '@/components/notifications/Notification';
import { getStockBatchById } from '@/lib/server/stock-batch/get'
import { UpdateStockBatchData, updateStockBatch } from '@/lib/server/stock-batch/update';
import { listProductVariantsForDropdown } from '@/lib/server/stock-batch/list-variants';
import { listSuppliers } from '@/lib/server/supplier/list';

export const Route = createFileRoute('/admin/stock-batches/$stockBatchId')({
    component: RouteComponent,
    loader: async (ctx) => {
        const [stockBatchResult, variants, suppliers] = await Promise.all([
            getStockBatchById({ data: { stockBatchId: ctx.params.stockBatchId } }),
            listProductVariantsForDropdown(),
            listSuppliers(),
        ]);
        return { stockBatchResult, variants, suppliers };
    },
})

function RouteComponent() {
    const { stockBatchResult, variants, suppliers } = Route.useLoaderData();
    const stockBatch = stockBatchResult.status === 'SUCCESS' ? stockBatchResult.data : null;
    const productVariants = variants.status === 'SUCCESS' ? variants.data : [];
    const supplierList = suppliers.status === 'SUCCESS' ? suppliers.data : [];
    const notifications = useNotifications();
    const navigate = useNavigate();
    const router = useRouter();

    const form = useForm({
        defaultValues: {
            stockBatchId: stockBatch ? stockBatch.id : '',
            product_variant_id: stockBatch ? stockBatch.product_variant_id : '',
            supplier: stockBatch ? (stockBatch.supplier || '') : '',
            quantity_received: stockBatch ? stockBatch.quantity_received : 0,
            buy_price_per_unit: stockBatch ? stockBatch.buy_price_per_unit : 0,
            sell_price_per_unit: stockBatch ? stockBatch.sell_price_per_unit : 0,
            min_sale_price_per_unit: stockBatch ? stockBatch.min_sale_price_per_unit : 0,
            received_at: stockBatch ? stockBatch.received_at : new Date(),
            restore_stock_batch: false,
        },
        validators: {
            onChange: UpdateStockBatchData
        },
        onSubmit: async (values) => {
            const data = {
                stockBatchId: values.value.stockBatchId,
                product_variant_id: values.value.product_variant_id,
                supplier: values.value.supplier,
                quantity_received: values.value.quantity_received,
                buy_price_per_unit: values.value.buy_price_per_unit,
                sell_price_per_unit: values.value.sell_price_per_unit,
                min_sale_price_per_unit: values.value.min_sale_price_per_unit,
                received_at: values.value.received_at,
                restore_stock_batch: values.value.restore_stock_batch,
            }

            notifications.clear();

            return updateStockBatch({
                data,
            }).then((result) => {
                if (result.status === 'SUCCESS') {
                    notifications.addNotification({
                        message: 'Stock batch updated successfully.',
                        type: 'SUCCESS',
                    });
                    router.invalidate();
                    navigate({ to: '/admin/stock-batches' });
                } else {
                    notifications.addNotification({
                        message: result.error || 'An error occurred while updating the stock batch.',
                        type: 'ERROR',
                    });
                }
            }).catch(() => {
                notifications.addNotification({
                    message: 'An unexpected error occurred.',
                    type: 'ERROR',
                });
            });
        }
    });

    if (!stockBatch) {
        return <Heading level={2}>Stock batch not found</Heading>;
    }

    return (
        <>
            <Heading level={2} className='mt-12 mb-4'>
                Edit Stock Batch
            </Heading>
            <form
                className='mt-8 w-full max-w-md space-y-4'
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}>
                <div>
                    <form.Field
                        name="product_variant_id"
                        children={
                            (field) => {
                                return (
                                    <>
                                        <label className="block text-sm font-medium mb-1">Product Variant *</label>
                                        <select
                                            name={field.name}
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            className="select select-bordered w-full"
                                        >
                                            <option value="">Select a product variant</option>
                                            {productVariants.map((variant) => (
                                                <option key={variant.id} value={variant.id}>
                                                    {variant.product_name} - {variant.name} ({variant.sku})
                                                </option>
                                            ))}
                                        </select>
                                        <FieldInfo field={field} />
                                    </>
                                )
                            }
                        }
                    />
                </div>
                <div>
                    <form.Field
                        name="supplier"
                        children={
                            (field) => {
                                return (
                                    <>
                                        <label className="block text-sm font-medium mb-1">Supplier</label>
                                        <select
                                            name={field.name}
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            className="select select-bordered w-full"
                                        >
                                            <option value="">No supplier</option>
                                            {supplierList.map((supplier) => (
                                                <option key={supplier.id} value={supplier.id}>
                                                    {supplier.name}
                                                </option>
                                            ))}
                                        </select>
                                        <FieldInfo field={field} />
                                    </>
                                )
                            }
                        }
                    />
                </div>
                <div>
                    <form.Field
                        name="quantity_received"
                        children={
                            (field) => {
                                return (
                                    <>
                                        <label className="block text-sm font-medium mb-1">Quantity Received *</label>
                                        <Input
                                            type="number"
                                            name={field.name}
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(parseInt(e.target.value) || 0)}
                                            placeholder='0'
                                            hasError={field.state.meta.isTouched && !field.state.meta.isValid}
                                        />
                                        <FieldInfo field={field} />
                                    </>
                                )
                            }
                        }
                    />
                </div>
                <div>
                    <form.Field
                        name="buy_price_per_unit"
                        children={
                            (field) => {
                                return (
                                    <>
                                        <label className="block text-sm font-medium mb-1">Buy Price (cents) *</label>
                                        <Input
                                            type="number"
                                            name={field.name}
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(parseInt(e.target.value) || 0)}
                                            placeholder='0'
                                            hasError={field.state.meta.isTouched && !field.state.meta.isValid}
                                        />
                                        <FieldInfo field={field} />
                                    </>
                                )
                            }
                        }
                    />
                </div>
                <div>
                    <form.Field
                        name="sell_price_per_unit"
                        children={
                            (field) => {
                                return (
                                    <>
                                        <label className="block text-sm font-medium mb-1">Sell Price (cents) *</label>
                                        <Input
                                            type="number"
                                            name={field.name}
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(parseInt(e.target.value) || 0)}
                                            placeholder='0'
                                            hasError={field.state.meta.isTouched && !field.state.meta.isValid}
                                        />
                                        <FieldInfo field={field} />
                                    </>
                                )
                            }
                        }
                    />
                </div>
                <div>
                    <form.Field
                        name="min_sale_price_per_unit"
                        children={
                            (field) => {
                                return (
                                    <>
                                        <label className="block text-sm font-medium mb-1">Min Price (cents) *</label>
                                        <Input
                                            type="number"
                                            name={field.name}
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(parseInt(e.target.value) || 0)}
                                            placeholder='0'
                                            hasError={field.state.meta.isTouched && !field.state.meta.isValid}
                                        />
                                        <FieldInfo field={field} />
                                    </>
                                )
                            }
                        }
                    />
                </div>
                <div>
                    <form.Field
                        name="received_at"
                        children={
                            (field) => {
                                return (
                                    <>
                                        <label className="block text-sm font-medium mb-1">Received Date *</label>
                                        <Input
                                            type="date"
                                            name={field.name}
                                            value={field.state.value.toLocaleDateString()}
                                            onChange={(e) => field.handleChange(new Date(e.target.value))}
                                            hasError={field.state.meta.isTouched && !field.state.meta.isValid}
                                        />
                                        <FieldInfo field={field} />
                                    </>
                                )
                            }
                        }
                    />
                </div>
                {stockBatch?.deleted_at !== null && (
                    <div className='mt-2'>
                        <form.Field
                            name="restore_stock_batch"
                            children={
                                (field) => {
                                    return (
                                        <>
                                            <label className='flex items-center space-x-2'>
                                                <input
                                                    type='checkbox'
                                                    name={field.name}
                                                    checked={field.state.value}
                                                    onChange={(e) => field.handleChange(e.target.checked)}
                                                    className='checkbox'
                                                />
                                                <span>Restore Stock Batch?</span>
                                            </label>
                                            <FieldInfo field={field} />
                                        </>
                                    )
                                }
                            }
                        />
                    </div>)}
                <div className='flex flex-row justify-between mt-8'>
                    <button
                        type='button'
                        className='btn btn-neutral'
                        onClick={() => navigate({ to: '/admin/stock-batches' })}
                    >
                        Cancel
                    </button>
                    <form.Subscribe
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
        </>
    )
}
