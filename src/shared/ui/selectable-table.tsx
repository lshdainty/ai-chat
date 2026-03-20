import { useMemo, useState } from 'react'
import {
  type ColumnDef,
  type RowSelectionState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { cn } from '@/shared/lib/index'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import { Checkbox } from '@/shared/ui/checkbox'
import { Button } from '@/shared/ui/button'
import { useChatAction } from '@/features/chat/model/chatActionContext'

interface RowData {
  id: string
  [key: string]: string
}

interface SelectableTableConfig {
  type: 'checkbox' | 'radio'
  title?: string
  description?: string
  columns: string[]
  rows: { id: string; values: string[] }[]
  confirmText?: string
}

interface SelectableTableProps {
  code: string
  className?: string
}

export function SelectableTable({ code, className }: SelectableTableProps) {
  const { onSendMessage } = useChatAction()
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [confirmed, setConfirmed] = useState(false)

  const tableConfig = useMemo<SelectableTableConfig | null>(() => {
    try {
      const parsed = JSON.parse(code) as SelectableTableConfig
      if (!parsed.type || !parsed.columns || !parsed.rows) return null
      return parsed
    } catch {
      return null
    }
  }, [code])

  // Transform rows to flat objects
  const data = useMemo<RowData[]>(() => {
    if (!tableConfig) return []
    return tableConfig.rows.map((row) => {
      const obj: RowData = { id: row.id }
      tableConfig.columns.forEach((col, i) => {
        obj[col] = row.values[i] ?? ''
      })
      return obj
    })
  }, [tableConfig])

  // Build columns with selection column
  const columns = useMemo<ColumnDef<RowData>[]>(() => {
    if (!tableConfig) return []
    const isCheckbox = tableConfig.type === 'checkbox'

    const selectionCol: ColumnDef<RowData> = {
      id: 'select',
      header: isCheckbox
        ? ({ table }) => (
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected()
                  ? true
                  : table.getIsSomePageRowsSelected()
                    ? 'indeterminate'
                    : false
              }
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              disabled={confirmed}
              aria-label="전체 선택"
            />
          )
        : () => <span className="text-xs text-muted-foreground">선택</span>,
      cell: ({ row }) =>
        isCheckbox ? (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            disabled={confirmed}
            onClick={(e) => e.stopPropagation()}
            aria-label="행 선택"
          />
        ) : (
          <div className="flex items-center justify-center">
            <div
              className={cn(
                'h-4 w-4 rounded-full border-2 transition-colors',
                row.getIsSelected()
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground',
                confirmed && 'opacity-60'
              )}
            >
              {row.getIsSelected() && (
                <div className="flex h-full items-center justify-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                </div>
              )}
            </div>
          </div>
        ),
      size: 48,
      enableSorting: false,
      enableHiding: false,
    }

    const dataCols: ColumnDef<RowData>[] = tableConfig.columns.map((col) => ({
      accessorKey: col,
      header: col,
    }))

    return [selectionCol, ...dataCols]
  }, [tableConfig, confirmed])

  const table = useReactTable({
    data,
    columns,
    state: { rowSelection },
    enableRowSelection: !confirmed,
    enableMultiRowSelection: tableConfig?.type === 'checkbox',
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  })

  if (!tableConfig) {
    return (
      <div className={cn('rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive', className)}>
        <p className="font-medium">테이블 데이터 파싱 오류</p>
        <pre className="mt-1 text-xs opacity-70">올바른 JSON 형식이 아닙니다.</pre>
      </div>
    )
  }

  const { title, description, confirmText = '선택 완료' } = tableConfig
  const selectedCount = Object.keys(rowSelection).length

  const handleConfirm = () => {
    if (selectedCount === 0) return
    setConfirmed(true)

    const selectedIds = Object.keys(rowSelection)
    const selectedRows = tableConfig.rows.filter((r) => selectedIds.includes(r.id))
    const summary = selectedRows
      .map((r) => r.values.join(' | '))
      .join('\n')

    onSendMessage(`[선택 결과]\n${summary}`)
  }

  const handleRowClick = (rowId: string) => {
    if (confirmed) return
    if (tableConfig.type === 'radio') {
      setRowSelection({ [rowId]: true })
    } else {
      setRowSelection((prev) => {
        const next = { ...prev }
        if (next[rowId]) {
          delete next[rowId]
        } else {
          next[rowId] = true
        }
        return next
      })
    }
  }

  return (
    <div className={cn('not-prose rounded-lg border bg-card p-4', className)}>
      {title && <p className="mb-1 text-sm font-semibold">{title}</p>}
      {description && <p className="mb-3 text-xs text-muted-foreground">{description}</p>}

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'text-xs font-medium',
                      header.id === 'select' && 'w-12 text-center'
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={cn(
                    'cursor-pointer transition-colors',
                    row.getIsSelected() && 'bg-primary/5',
                    confirmed && 'cursor-default'
                  )}
                  onClick={() => handleRowClick(row.id)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'text-sm',
                        cell.column.id === 'select' && 'text-center'
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-16 text-center text-muted-foreground">
                  데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {confirmed
            ? `${selectedCount}개 항목이 선택되었습니다.`
            : selectedCount > 0
              ? `${selectedCount}개 선택됨`
              : tableConfig.type === 'checkbox'
                ? '항목을 선택해주세요. (복수 선택 가능)'
                : '항목을 선택해주세요.'}
        </p>
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            handleConfirm()
          }}
          disabled={selectedCount === 0 || confirmed}
        >
          {confirmed ? '선택 완료' : confirmText}
        </Button>
      </div>
    </div>
  )
}
