import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form';
import Button from '@/components/Button';
import { FieldInfo } from '@/components/FieldInfo';
import Heading from '@/components/Heading';
import { Input } from '@/components/Input';
import { NotificationsList, useNotifications } from '@/components/notifications/Notification';
import { CreateSaleInput, createSale } from '@/lib/server/sales/create';

export const Route = createFileRoute('/admin/sales/new')({
    component: RouteComponent,
})

function RouteComponent() {
    const notifications = useNotifications();
    const navigate = useNavigate();
    const router = useRouter();
    const form = useForm({
        defaultValues: {
            date: new Date(),
            total_amount: 0,
            customer_name: '',
            customer_contact: '',
        },
        validators: {
            onChange: CreateSaleInput,
        },
        onSubmit: async (values) => {
            const data = {
                date: values.value.date,
                total_amount: values.value.total_amount,
                customer_name: values.value.customer_name,
                customer_contact: values.value.customer_contact,
            }
            return createSale({
                data,
            }).then(async (result) => {
                notifications.clear();

                if (result.status === 'SUCCESS') {
                    notifications.addNotification({
                        message: 'Sale created successfully.',
                        type: 'SUCCESS',
                    });
                    // Reset form
                    form.reset();
                    // Invalidate before navigating to ensure fresh data
                    await router.invalidate();
                    navigate({ to: '/admin/sales' });
                } else {
                    notifications.addNotification({
                        message: result.error || 'An error occurred while creating the sale.',
                        type: 'ERROR',
                    });
                }
            }).catch((error) => {
                notifications.addNotification({
                    message: error.message || 'An unexpected error occurred.',
                    type: 'ERROR',
                });
            });
        },
    });

    return (
        <>
            <NotificationsList />
            <Heading level={2} className='mt-12'>Create New Sale</Heading>
            <form
                className='mt-8 w-full max-w-md space-y-4'
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}>
                <div>
                    <form.Field
                        name="date"
                        children={
                            (field) => {
                                return (
                                    <>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Sale Date
                                        </label>
                                        <Input
                                            type="date"
                                            name={field.name}
                                            value={field.state.value instanceof Date ? field.state.value.toISOString().split('T')[0] : ''}
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
                <div className='mt-2'>
                    <form.Field
                        name="customer_name"
                        children={
                            (field) => {
                                return (
                                    <>
                                        <Input
                                            name={field.name}
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder='Enter Customer Name'
                                            hasError={field.state.meta.isTouched && !field.state.meta.isValid}
                                        />
                                        <FieldInfo field={field} />
                                    </>
                                )
                            }
                        }
                    />
                </div>
                <div className='mt-2'>
                    <form.Field
                        name="customer_contact"
                        children={
                            (field) => {
                                return (
                                    <>
                                        <Input
                                            name={field.name}
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder='Enter Customer Contact'
                                            hasError={field.state.meta.isTouched && !field.state.meta.isValid}
                                        />
                                        <FieldInfo field={field} />
                                    </>
                                )
                            }
                        }
                    />
                </div>
                <div className='mt-2'>
                    <form.Field
                        name="total_amount"
                        children={
                            (field) => {
                                return (
                                    <>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            name={field.name}
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(parseFloat(e.target.value))}
                                            placeholder='Enter Total Amount'
                                            hasError={field.state.meta.isTouched && !field.state.meta.isValid}
                                        />
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
                        onClick={() => navigate({ to: '/admin/sales' })}
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
                                {isSubmitting ? 'Creating...' : 'Create Sale'}
                            </Button>
                        )}
                    />
                </div>
            </form>
        </>
    )
}
