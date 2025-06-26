"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row, index) => (
            <div
              key={row.id}
              className={`flex w-full ${index < table.getRowModel().rows.length - 1 ? 'border-b' : ''}`}>
              {row.getVisibleCells().map((cell) => (
                <div key={cell.id} className="flex-1">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No agents found.
          </div>
        )}
      </div>
    </div>
  )
}