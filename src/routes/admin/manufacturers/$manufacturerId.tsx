import { useForm } from '@tanstack/react-form';
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import Button from '@/components/Button';
import { FieldInfo } from '@/components/FieldInfo';
import Heading from '@/components/Heading';
import { Input } from '@/components/Input';
import { useNotifications } from '@/components/notifications/Notification';
import { TextArea } from '@/components/TextArea';
import { getManufacturerById } from '@/lib/server/manufacturer/get'
import { UpdateManufacturerData, updateManufacturer } from '@/lib/server/manufacturer/update';

export const Route = createFileRoute('/admin/manufacturers/$manufacturerId')({
  component: RouteComponent,
  loader: async (ctx) => getManufacturerById({ data: { manufacturerId: ctx.params.manufacturerId } }),
})

function RouteComponent() {
  const initialData = Route.useLoaderData();
  const manufacturer = initialData.status === 'SUCCESS' ? initialData.data : null;
  const notifications = useNotifications();
  const navigate = useNavigate();
  const router = useRouter();
  const form = useForm({
    defaultValues: {
      manufacturerId: manufacturer ? manufacturer.id : '',
      name: manufacturer ? manufacturer.name : '',
      contact_info: manufacturer ? manufacturer.contact_info : '',
      restore_manufacturer: false,
    },
    validators: {
      onChange: UpdateManufacturerData,
    },
    onSubmit: async (values) => {
      const data = {
        manufacturerId: values.value.manufacturerId,
        name: values.value.name,
        contact_info: values.value.contact_info || '',
        restore_manufacturer: values.value.restore_manufacturer,
      }

      notifications.clear();

      return updateManufacturer({
        data,
      }).then((result) => {
        if (result.status === 'SUCCESS') {
          notifications.addNotification({
            message: 'Manufacturer updated successfully.',
            type: 'SUCCESS',
          });
          router.invalidate();
          navigate({ to: '/admin/manufacturers' });
        } else {
          notifications.addNotification({
            message: result.error || 'An error occurred while updating the manufacturer.',
            type: 'ERROR',
          });
        }
      }).catch((error) => {
        notifications.addNotification({
          message: error.message || 'An unexpected error occurred.',
          type: 'ERROR',
        });
      });
    }
  });

  if (!manufacturer) {
    return <Heading level={2}>Manufacturer not found</Heading>;
  }

  return (
    <>
      <Heading level={2} className='mt-12 mb-4'>
        Edit Manufacturer
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
                      value={field.state.value || ''}
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
        {manufacturer?.deleted_at !== null && (
          <div className='mt-2'>
            <form.Field
              name="restore_manufacturer"
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
                        <span>Restore Manufacturer?</span>
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
                {isSubmitting ? 'Updating...' : 'Save Changes'}
              </Button>
            )}
          />
        </div>
      </form>
    </>
  )
}
