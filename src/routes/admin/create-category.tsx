import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { Input } from '@/components/Input'
import { FieldInfo } from '@/components/FieldInfo'
import Heading from '@/components/Heading'
import Container from '@/components/Container'
import { createCategory } from '@/api/categories/server-fns'
import {
  categorySchema,
  type CreateCategoryInput,
} from '@/api/categories/types'

export const Route = createFileRoute('/admin/create-category')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  // Mutation to create category
  const mutation = useMutation({
    mutationFn: (data: CreateCategoryInput) => createCategory({ data }),
    onSuccess: () => {
      console.log('Category created!')
      // Optionally, redirect or invalidate queries
      navigate({ to: '/admin/categories' })
    },
    onError: (err: any) => {
      console.error('Error creating category', err)
    },
  })

  // Form
  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
    },
    validators: { onChange: categorySchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value)
    },
  })

  return (
    <Container>
      <Heading level={1} className="mt-12">
        Create New Category
      </Heading>

      <form
        className="mt-8 w-full max-w-md space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
      >
        <div>
          <form.Field
            name="name"
            children={(field) => (
              <>
                <Input
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Category Name"
                  hasError={
                    field.state.meta.isTouched && !!field.state.meta.isValid
                  }
                />
                <FieldInfo field={field} />
              </>
            )}
          />
        </div>

        <div className="mt-2">
          <form.Field
            name="description"
            children={(field) => (
              <>
                <Input
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Description (optional)"
                  hasError={
                    field.state.meta.isTouched && !!field.state.meta.isValid
                  }
                />
                <FieldInfo field={field} />
              </>
            )}
          />
        </div>

        <div className="mt-4">
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="w-full bg-accent text-white rounded-xl px-4 py-2 hover:bg-brand cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Category'}
              </button>
            )}
          />
        </div>
      </form>
    </Container>
  )
}
