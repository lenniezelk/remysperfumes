import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import type {UpdateCategoryInput} from '@/lib/server/categories/types';
import { Input } from '@/components/Input'
import { FieldInfo } from '@/components/FieldInfo'
import Heading from '@/components/Heading'
import Container from '@/components/Container'
import {
  getCategoryById,
  updateCategory,
} from '@/lib/server/categories/server-fns'
import {
  
  updateCategorySchema
} from '@/lib/server/categories/types'
import Button from '@/components/Button'

export const Route = createFileRoute('/admin/categories/category/$id')({
  loader: async ({ params }) => {
    const res = await getCategoryById({ data: { id: params.id } })
    if ('error' in res)
      throw new Error(res.message || 'Failed to load category')
    return res.data
  },
  component: RouteComponent,
})

function RouteComponent() {
  const category = Route.useLoaderData()
  console.log('Loaded category:', category)
  const navigate = useNavigate()
  // Mutation to create category
  const mutation = useMutation({
    mutationFn: (data: UpdateCategoryInput) => updateCategory({ data }),
    onSuccess: () => {
      console.log('Category updated!')
      // Optionally, redirect or invalidate queries
      navigate({ to: '/admin/categories' })
    },
    onError: (err: any) => {
      console.error('Error updating category', err)
    },
  })

  // Form
  const form = useForm({
    defaultValues: {
      id: category?.id || '',
      name: category?.name || '',
      description: category?.description || '',
    },
    validators: { onChange: updateCategorySchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value)
    },
  })

  return (
    <Container>
      <Heading level={1} className="mt-12">
        Edit Category
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
              <Button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="disabled:opacity-80"
              >
                {isSubmitting ? 'Creating...' : 'Update Category'}
              </Button>
            )}
          />
        </div>
      </form>
    </Container>
  )
}
