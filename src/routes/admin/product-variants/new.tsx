import Button from '@/components/Button';
import { FieldInfo } from '@/components/FieldInfo';
import Heading from '@/components/Heading';
import { Input } from '@/components/Input';
import { NotificationsList, useNotifications } from '@/components/notifications/Notification';
import { createProductVariant } from '@/lib/server/product-variant/create';
import { createProductSku } from '@/lib/server/product-variant/sku';
import { listProductsForDropdown } from '@/lib/server/product-variant/list-products';
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form';
import { useState } from 'react';
import { fileToBase64 } from '@/lib/utils/image';

export const Route = createFileRoute('/admin/product-variants/new')({
    component: RouteComponent,
    loader: async () => {
        const products = await listProductsForDropdown();
        return { products };
    },
})

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function RouteComponent() {
    const { products } = Route.useLoaderData();
    const notifications = useNotifications();
    const navigate = useNavigate();
    const router = useRouter();
    const [isGeneratingSku, setIsGeneratingSku] = useState(false);

    const productList = products.status === 'SUCCESS' ? products.data : [];

    const form = useForm({
        defaultValues: {
            product_id: '',
            name: '',
            sku: '',
            default_sell_price: 0,
            productImage: '',
            localProductImage: null as File | null,
        },
        onSubmit: async (values) => {
            return createProductVariant({
                data: {
                    product_id: values.value.product_id,
                    name: values.value.name,
                    sku: values.value.sku,
                    default_sell_price: values.value.default_sell_price,
                    productImage: values.value.localProductImage ? await fileToBase64(values.value.localProductImage) : '',
                }
            }).then(async (result) => {
                notifications.clear();

                if (result.status === 'SUCCESS') {
                    notifications.addNotification({
                        message: 'Product variant created successfully.',
                        type: 'SUCCESS',
                    });
                    form.reset();
                    notifications.clear();
                    await router.invalidate();
                    navigate({ to: '/admin/product-variants' });
                } else {
                    notifications.addNotification({
                        message: result.error || 'An error occurred while creating the product variant.',
                        type: 'ERROR',
                    });
                }
            }).catch((error) => {
                console.error(error);
                notifications.addNotification({
                    message: 'An unexpected error occurred.',
                    type: 'ERROR',
                });
            });
        },
        listeners: {
            onChangeDebounceMs: 500,
            onChange: ({ fieldApi }) => {
                if (fieldApi.name === 'product_id' || fieldApi.name === 'name') {
                    if (fieldApi.form.getFieldValue('product_id') && fieldApi.form.getFieldValue('name')) {
                        notifications.clear();
                        setIsGeneratingSku(true);
                        createProductSku({
                            data: {
                                product_id: fieldApi.form.getFieldValue('product_id'),
                                variant_name: fieldApi.form.getFieldValue('name'),
                            },
                        }).then((result) => {
                            if (result.status === 'SUCCESS') {
                                form.setFieldValue('sku', result.data.sku);
                            } else {
                                notifications.addNotification({
                                    message: result.error || 'An error occurred while generating the SKU.',
                                    type: 'ERROR',
                                });
                            }
                        }).finally(() => {
                            setIsGeneratingSku(false);
                        });
                    }
                }
            }
        }
    });

    return (
        <>
            <NotificationsList />
            <Heading level={2} className='mt-12'>Create New Product Variant</Heading>
            <form
                encType='multipart/form-data'
                className='mt-8 w-full max-w-md space-y-4'
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}>
                <div>
                    <form.Field
                        name="product_id"
                        children={
                            (field) => {
                                return (
                                    <>
                                        <label className="block text-sm font-medium mb-1">Product *</label>
                                        <select
                                            name={field.name}
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            className="select select-bordered w-full"
                                        >
                                            <option value="">Select a product</option>
                                            {productList.map((product) => (
                                                <option key={product.id} value={product.id}>
                                                    {product.name}
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
                        name="name"
                        children={
                            (field) => {
                                return (
                                    <>
                                        <label className="block text-sm font-medium mb-1">Variant Name *</label>
                                        <Input
                                            type="text"
                                            name={field.name}
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder='e.g., Red - 100ml'
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
                        name="sku"
                        children={
                            (field) => {
                                return (
                                    <>
                                        <label className="block text-sm font-medium mb-1">
                                            SKU *
                                            {isGeneratingSku && <span className="text-xs text-gray-500 ml-2">(Generating...)</span>}
                                        </label>
                                        <Input
                                            type="text"
                                            name={field.name}
                                            value={field.state.value}
                                            readOnly
                                            placeholder='Auto-generated from product and variant'
                                            hasError={field.state.meta.isTouched && !field.state.meta.isValid}
                                            className="bg-gray-50 cursor-not-allowed"
                                        />
                                        <FieldInfo field={field} />
                                        <p className="text-xs text-gray-500 mt-1">SKU is automatically generated from product and variant name</p>
                                    </>
                                )
                            }
                        }
                    />
                </div>
                <div>
                    <form.Field
                        name="default_sell_price"
                        children={
                            (field) => {
                                return (
                                    <>
                                        <label className="block text-sm font-medium mb-1">Default Sell Price (cents)</label>
                                        <Input
                                            type="number"
                                            name={field.name}
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(isNaN(Number(e.target.value)) ? 0 : Number(e.target.value))}
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
                        name="localProductImage"
                        children={
                            (field) => {
                                return (
                                    <>
                                        <label htmlFor='localProductImage' className="btn btn-neutral">
                                            {field.state.value ? 'Change Image' : 'Select Product Image'}
                                        </label>
                                        <input
                                            id='localProductImage'
                                            className='hidden'
                                            type="file"
                                            accept='image/*'
                                            name={field.name}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) {
                                                    field.handleChange(null);
                                                    return;
                                                }

                                                // Validate file size
                                                if (file.size === 0) {
                                                    notifications.addNotification({
                                                        message: 'Image file cannot be empty',
                                                        type: 'ERROR',
                                                    });
                                                    e.target.value = ''; // Reset input
                                                    return;
                                                }

                                                if (file.size > MAX_FILE_SIZE) {
                                                    notifications.addNotification({
                                                        message: 'Image size must be less than 5MB',
                                                        type: 'ERROR',
                                                    });
                                                    e.target.value = ''; // Reset input
                                                    return;
                                                }

                                                field.handleChange(file);
                                            }}
                                        />
                                        {field.state.value && (
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-600 mb-1">Selected: {field.state.value.name}</p>
                                                <img
                                                    src={URL.createObjectURL(field.state.value)}
                                                    alt="Preview"
                                                    className="max-w-xs max-h-48 rounded border"
                                                />
                                            </div>
                                        )}
                                        <FieldInfo field={field} />
                                    </>
                                )
                            }
                        }
                    />
                </div>
                <div className='flex flex-row justify-between mt-8'>
                    <button
                        type='button'
                        className='btn btn-neutral'
                        onClick={() => {
                            notifications.clear();
                            navigate({ to: '/admin/product-variants' })
                        }}
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
                                {isSubmitting ? 'Creating...' : 'Create Variant'}
                            </Button>
                        )}
                    />
                </div>
            </form>
        </>
    )
}
