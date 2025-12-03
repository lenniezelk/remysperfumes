import {
  Boxes,
  Database,
  Factory,
  Layers,
  Package,
  ShoppingCart,
  Tags,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { FileRouteTypes } from '@/routeTree.gen'
import type { RoleKey } from '@/lib/permissions';
import { roles } from '@/lib/permissions'

export interface ModelBlueprint {
  key: string
  name: string
  description: string
  icon: LucideIcon
  route: FileRouteTypes['to']
  roles: Array<RoleKey>
  children?: Array<ModelBlueprint>
}

export const modelsBlueprint: Array<ModelBlueprint> = [
  {
    key: 'category',
    name: 'Categories',
    description: 'Manage product categories',
    icon: Tags,
    route: '/admin/categories',
    roles: [roles.MANAGER, roles.ADMIN, roles.SUPERADMIN],
    children: [
      {
        key: 'product',
        name: 'Products',
        description: 'Manage products',
        icon: Package,
        route: '/admin/products',
        roles: [roles.MANAGER, roles.ADMIN, roles.SUPERADMIN],
      },
    ],
  },
  {
    key: 'product',
    name: 'Products',
    description: 'Manage products',
    icon: Package,
    route: '/admin/products',
    roles: [roles.MANAGER, roles.ADMIN, roles.SUPERADMIN],
  },
  {
    key: 'product-variant',
    name: 'Product Variants',
    description: 'Manage product variants',
    icon: Layers,
    route: '/admin/product-variants',
    roles: [roles.MANAGER, roles.ADMIN, roles.SUPERADMIN],
  },
  {
    key: 'supplier',
    name: 'Suppliers',
    description: 'Manage suppliers',
    icon: Users,
    route: '/admin/suppliers',
    roles: [roles.MANAGER, roles.ADMIN, roles.SUPERADMIN],
  },
  {
    key: 'stock-batch',
    name: 'Stock Batches',
    description: 'Manage stock batches',
    icon: Boxes,
    route: '/admin/stock-batches',
    roles: [roles.MANAGER, roles.ADMIN, roles.SUPERADMIN],
  },
  {
    key: 'manufacturer',
    name: 'Manufacturers',
    description: 'Manage manufacturers',
    icon: Factory,
    route: '/admin/manufacturers',
    roles: [roles.MANAGER, roles.ADMIN, roles.SUPERADMIN],
  },
  {
    key: 'sale',
    name: 'Sales',
    description: 'View all sales',
    icon: ShoppingCart,
    route: '/admin/sales',
    roles: [roles.STAFF,roles.MANAGER, roles.ADMIN, roles.SUPERADMIN],
  },
  // {
  //   key: 'role',
  //   name: 'Roles',
  //   description: 'Manage user roles & permissions',
  //   icon: Database,
  //   route: '/admin/role',
  // },
  {
    key: 'user',
    name: 'Users',
    description: 'Manage system users',
    icon: Users,
    route: '/admin/users',
    roles: [roles.MANAGER, roles.ADMIN, roles.SUPERADMIN],
  },
]
