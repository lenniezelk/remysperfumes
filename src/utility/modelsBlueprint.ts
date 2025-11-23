import type { LucideIcon } from 'lucide-react'
import type { FileRouteTypes } from '@/routeTree.gen'
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
import { type RoleKey } from '@/lib/permissions'
import { roles } from '@/lib/permissions'

export interface ModelBlueprint {
  key: string
  name: string
  description: string
  icon: LucideIcon
  route: FileRouteTypes['to']
  roles: RoleKey[]
  children?: ModelBlueprint[]
}

export const modelsBlueprint: ModelBlueprint[] = [
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
    // children: [
    //   {
    //     key: 'product-variant',
    //     name: 'Product Variants',
    //     description: 'Manage product variants',
    //     icon: Layers,
    //     route: '/admin/product-variant',
    //     children: [
    //       {
    //         key: 'stock-batch',
    //         name: 'Stock Batches',
    //         description: 'Manage stock batches',
    //         icon: Boxes,
    //         route: '/admin/stock-batch',
    //       },
    //     ],
    //   },
    // ],
  },
  // {
  //   key: 'sale',
  //   name: 'Sales',
  //   description: 'View all sales',
  //   icon: ShoppingCart,
  //   route: '/admin/sale',
  //   children: [
  //     {
  //       key: 'sale-item',
  //       name: 'Sale Items',
  //       description: 'View sale items',
  //       icon: ShoppingCart,
  //       route: '/admin/sale-item',
  //     },
  //   ],
  // },
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
