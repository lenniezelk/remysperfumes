import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import type { Manufacturer } from '@/lib/types'
import type {CreateProductInput} from '@/lib/server/products/types';
import { Input } from '@/components/Input'
import { FieldInfo } from '@/components/FieldInfo'
import Heading from '@/components/Heading'
import Container from '@/components/Container'
import { createProduct } from '@/lib/server/products/server-fns'
import { getAllCategories } from '@/lib/server/categories/server-fns'
import {
  
  createProductSchema
} from '@/lib/server/products/types'
import { listManufacturers } from '@/lib/server/manufacturer/list'
import Button from '@/components/Button'

export const Route = createFileRoute('/admin/products/new')({
  loader: async () => {
    const categories = await getAllCategories()
    const manufacturers = await listManufacturers()
    return { categories, manufacturers }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { categories, manufacturers } = Route.useLoaderData()
  const [manufacturerData] = useState<Array<Manufacturer>>(() =>
    manufacturers.status === 'SUCCESS' ? manufacturers.data : [],
  )
  const navigate = useNavigate()
  // Mutation to create product
  const mutation = useMutation({
    mutationFn: (data: CreateProductInput) => createProduct({ data }),
    onSuccess: () => {
      // Optionally, redirect or invalidate queries
      navigate({ to: '/admin/products' })
    },
    onError: (err: any) => {
      console.error('Error creating product', err)
    },
  })

  const defaultValues: CreateProductInput = {
    name: '',
    description: '',
    category_id: '',
    brand: '',
    default_sell_price: 0,
    manufacturer: '',
  }

  // Form
  const form = useForm({
    defaultValues: defaultValues,
    validators: { onChange: createProductSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value)
    },
  })

  return (
    <Container>
      <Heading level={1} className="mt-12">
        Create New Product
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
                  placeholder="Product Name"
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
          <form.Field
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
          <form.Field
            name="brand"
            children={(field) => (
              <>
                <Input
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Brand (optional)"
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
                  hasError={
                    field.state.meta.isTouched && !field.state.meta.isValid
                  }
                />
                <FieldInfo field={field} />
              </>
            )}
          />
        </div>

        <div className="mt-4">
          <form.Field
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

        <div className="mt-4">
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="disabled:opacity-80"
              >
                {isSubmitting ? 'Creating...' : 'Create Product'}
              </Button>
            )}
          />
        </div>
      </form>
    </Container>
  )
}
