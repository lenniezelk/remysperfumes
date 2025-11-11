import type { LucideIcon } from 'lucide-react'
import {
  Tags,
  Factory,
  Package,
  Layers,
  Users,
  Boxes,
  ShoppingCart,
  Database,
} from 'lucide-react'

export interface ModelBlueprint {
  key: string
  name: string
  description: string
  icon: LucideIcon
  route: string
  children?: ModelBlueprint[]
}

export const modelsBlueprint: ModelBlueprint[] = [
  {
    key: 'category',
    name: 'Categories',
    description: 'Manage product categories',
    icon: Tags,
    route: '/dashboard/categories',
    children: [
      {
        key: 'product',
        name: 'Products',
        description: 'Manage products',
        icon: Package,
        route: '/dashboard/products',
      },
    ],
  },
  {
    key: 'product',
    name: 'Products',
    description: 'Manage products',
    icon: Package,
    route: '/dashboard/products',
    children: [
      {
        key: 'product-variant',
        name: 'Product Variants',
        description: 'Manage product variants',
        icon: Layers,
        route: '/admin/product-variant',
        children: [
          {
            key: 'stock-batch',
            name: 'Stock Batches',
            description: 'Manage stock batches',
            icon: Boxes,
            route: '/admin/stock-batch',
          },
        ],
      },
    ],
  },
  {
    key: 'sale',
    name: 'Sales',
    description: 'View all sales',
    icon: ShoppingCart,
    route: '/admin/sale',
    children: [
      {
        key: 'sale-item',
        name: 'Sale Items',
        description: 'View sale items',
        icon: ShoppingCart,
        route: '/admin/sale-item',
      },
    ],
  },
  {
    key: 'supplier',
    name: 'Suppliers',
    description: 'Manage suppliers',
    icon: Users,
    route: '/admin/supplier',
  },
  {
    key: 'manufacturer',
    name: 'Manufacturers',
    description: 'Manage manufacturers',
    icon: Factory,
    route: '/admin/manufacturer',
  },
  {
    key: 'role',
    name: 'Roles',
    description: 'Manage user roles & permissions',
    icon: Database,
    route: '/admin/role',
  },
  {
    key: 'user',
    name: 'Users',
    description: 'Manage system users',
    icon: Users,
    route: '/admin/user',
  },
]
