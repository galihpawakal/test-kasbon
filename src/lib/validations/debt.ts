import { z } from 'zod'

export const debtSchema = z.object({
  type: z.enum(['owed_to_me', 'i_owe']),
  counterpart_name: z
    .string()
    .min(1, 'Nama orang wajib diisi')
    .max(100, 'Nama terlalu panjang'),
  amount: z.number()
    .int('Jumlah harus berupa bilangan bulat (tanpa desimal)')
    .nonnegative('Jumlah tidak boleh negatif'),
  note: z
    .string()
    .max(200, 'Catatan maksimal 200 karakter')
    .optional()
    .nullable()
    .transform((val) => val || null),
  due_date: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Format tanggal tidak valid',
    })
    .transform((val) => (val ? new Date(val).toISOString().split('T')[0] : null)),
  category_id: z
    .string()
    .uuid('Kategori tidak valid')
    .optional()
    .nullable()
    .transform((val) => val || null),
  currency: z
    .string()
    .length(3, 'Kode mata uang harus 3 huruf')
    .default('IDR')
    .optional(),
  counterpart_phone: z
    .string()
    .max(20, 'Nomor terlalu panjang')
    .optional()
    .nullable()
    .transform((val) => val || null),
})

export type DebtInput = z.infer<typeof debtSchema>
