import Button from '@/components/Button';
import { FieldInfo } from '@/components/FieldInfo';
import Heading from '@/components/Heading';
import { Input } from '@/components/Input';
import { useNotifications } from '@/components/notifications/Notification';
import { TextArea } from '@/components/TextArea';
import { getSupplierById } from '@/lib/server/supplier/get'
import { updateSupplier, UpdateSupplierData } from '@/lib/server/supplier/update';
import { useForm } from '@tanstack/react-form';
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/suppliers/$supplierId')({
  component: RouteComponent,
  loader: async (ctx) => getSupplierById({ data: { supplierId: ctx.params.supplierId } }),
})

function RouteComponent() {
  const initialData = Route.useLoaderData();
  const supplier = initialData.status === 'SUCCESS' ? initialData.data : null;
  const notifications = useNotifications();
  const navigate = useNavigate();
  const router = useRouter();
  const form = useForm({
    defaultValues: {
      supplierId: supplier ? supplier.id : '',
      name: supplier ? supplier.name : '',
      contact_info: supplier ? supplier.contact_info : '',
      restore_supplier: false,
    },
    validators: {
      onChange: UpdateSupplierData,
    },
    onSubmit: async (values) => {
      const data = {
        supplierId: values.value.supplierId,
        name: values.value.name,
        contact_info: values.value.contact_info || '',
        restore_supplier: values.value.restore_supplier,
      }

      notifications.clear();

      updateSupplier({
        data,
      }).then((result) => {
        if (result.status === 'SUCCESS') {
          notifications.addNotification({
            message: 'Supplier updated successfully.',
            type: 'SUCCESS',
          });
          router.invalidate();
          navigate({ to: '/admin/suppliers' });
        } else {
          notifications.addNotification({
            message: result.error || 'An error occurred while updating the supplier.',
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

  if (!supplier) {
    return <Heading level={2}>Supplier not found</Heading>;
  }

  return (
    <>
      <Heading level={2} className='mt-12 mb-4'>
        Edit Supplier
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
        {supplier?.deleted_at !== null && (
          <div className='mt-2'>
            <form.Field
              name="restore_supplier"
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
                        <span>Restore Supplier?</span>
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
            onClick={() => navigate({ to: '/admin/suppliers' })}
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
