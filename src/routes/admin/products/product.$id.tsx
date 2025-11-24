import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import type { Manufacturer } from '@/lib/types'
import type {UpdateProductInput} from '@/lib/server/products/types';
import { Input } from '@/components/Input'
import { FieldInfo } from '@/components/FieldInfo'
import Heading from '@/components/Heading'
import Container from '@/components/Container'
import { getProductById, updateProduct } from '@/lib/server/products/server-fns'
import { getAllCategories } from '@/lib/server/categories/server-fns'
import {
  
  updateProductSchema
} from '@/lib/server/products/types'
import { listManufacturers } from '@/lib/server/manufacturer/list'
import Button from '@/components/Button'

export const Route = createFileRoute('/admin/products/product/$id')({
  loader: async ({ params }) => {
    const categories = await getAllCategories()
    const manufacturers = await listManufacturers()
    const res = await getProductById({ data: { id: params.id } })
    if ('error' in res)
      throw new Error(res.message || 'Failed to load category')
    const data = res.data
    return { categories, data, manufacturers }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { categories, data, manufacturers } = Route.useLoaderData()
  const [manufacturerData] = useState<Array<Manufacturer>>(() =>
    manufacturers.status === 'SUCCESS' ? manufacturers.data : [],
  )
  const navigate = useNavigate()
  // Mutation to create product
  const mutation = useMutation({
    mutationFn: (data: UpdateProductInput) => updateProduct({ data }),
    onSuccess: () => {
      // Optionally, redirect or invalidate queries
      navigate({ to: '/admin/products' })
    },
    onError: (err: any) => {
      console.error('Error updating product', err)
    },
  })

  const defaultValues: UpdateProductInput = {
    id: data?.id || '',
    name: data?.name || '',
    description: data?.description || '',
    category_id: data?.category_id || '',
    brand: data?.brand || '',
    default_sell_price: data?.default_sell_price || 0,
    manufacturer: data?.manufacturer || '',
  }

  // Form
  const form = useForm({
    defaultValues: defaultValues,
    validators: { onChange: updateProductSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value)
    },
  })

  return (
    <Container>
      <Heading level={1} className="mt-12">
        Update Product
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
                {isSubmitting ? 'Creating...' : 'Update Product'}
              </Button>
            )}
          />
        </div>
      </form>
    </Container>
  )
}
