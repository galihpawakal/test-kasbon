import { z } from 'zod'

export const debtSchema = z.object({
  type: z.enum(['owed_to_me', 'i_owe'], {
    required_error: 'Tipe hutang wajib dipilih',
  }),
  counterpart_name: z
    .string({ required_error: 'Nama orang wajib diisi' })
    .min(1, 'Nama orang wajib diisi')
    .max(100, 'Nama terlalu panjang'),
  amount: z.coerce
    .number({
      required_error: 'Jumlah wajib diisi',
      invalid_type_error: 'Jumlah harus berupa angka',
    })
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
})

export type DebtInput = z.infer<typeof debtSchema>
