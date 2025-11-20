import Button from '@/components/Button';
import { FieldInfo } from '@/components/FieldInfo';
import Heading from '@/components/Heading';
import { Input } from '@/components/Input';
import { NotificationsList, useNotifications } from '@/components/notifications/Notification';
import { TextArea } from '@/components/TextArea';
import { createManufacturer, CreateManufacturerInput } from '@/lib/server/manufacturer/create';
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form';

export const Route = createFileRoute('/admin/manufacturers/new')({
    component: RouteComponent,
})

function RouteComponent() {
    const notifications = useNotifications();
    const navigate = useNavigate();
    const router = useRouter();
    const form = useForm({
        defaultValues: {
            name: '',
            contact_info: '',
        },
        validators: {
            onChange: CreateManufacturerInput,
        },
        onSubmit: async (values) => {
            const data = {
                name: values.value.name,
                contact_info: values.value.contact_info,
            }
            createManufacturer({
                data,
            }).then(async (result) => {
                notifications.clear();

                if (result.status === 'SUCCESS') {
                    notifications.addNotification({
                        message: 'Manufacturer created successfully.',
                        type: 'SUCCESS',
                    });
                    // Reset form
                    form.reset();
                    // Invalidate before navigating to ensure fresh data
                    await router.invalidate();
                    navigate({ to: '/admin/manufacturers' });
                } else {
                    notifications.addNotification({
                        message: result.error || 'An error occurred while creating the manufacturer.',
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
            <Heading level={2} className='mt-12'>Create New Manufacturer</Heading>
            <form
                className='mt-8 w-full max-w-md space-y-4'
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}>
                <div>
                    <form.Field
                        name="name"
                        children={
                            (field) => {
                                return (
                                    <>
                                        <Input
                                            name={field.name}
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder='Enter Name'
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
                        name="contact_info"
                        children={
                            (field) => {
                                return (
                                    <>
                                        <TextArea
                                            name={field.name}
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder='Enter Contact Info'
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
                        onClick={() => navigate({ to: '/admin/manufacturers' })}
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
                                {isSubmitting ? 'Creating...' : 'Create Manufacturer'}
                            </Button>
                        )}
                    />
                </div>
            </form>
        </>
    )
}
