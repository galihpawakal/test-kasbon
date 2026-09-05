'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogOut, Loader2, KeyRound, Mail, Eye, EyeOff, CheckCircle2, XCircle, Bell, Settings2 } from 'lucide-react'
import { logout, updatePassword } from '@/app/login/actions'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export function SettingsClient({ userEmail }: { userEmail: string }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: '', color: 'bg-gray-200' }
    let score = 0
    if (pass.length >= 6) score += 1
    if (pass.length >= 8) score += 1
    if (/[A-Z]/.test(pass)) score += 1
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1
    
    if (score <= 1) return { score: 1, text: 'Lemah', color: 'bg-red-500', w: 'w-1/3' }
    if (score === 2 || score === 3) return { score: 2, text: 'Sedang', color: 'bg-yellow-500', w: 'w-2/3' }
    return { score: 3, text: 'Kuat', color: 'bg-green-500', w: 'w-full' }
  }

  const strength = getPasswordStrength(newPassword)
  const isMatch = newPassword.length >= 6 && newPassword === confirmPassword
  const isMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword
  
  const isFormValid = isMatch && !isUpdating

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid) return

    setIsUpdating(true)
    
    try {
      const { error } = await updatePassword(newPassword)

      if (error) {
        throw new Error(error)
      }

      toast.success('Password berhasil diperbarui')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan perubahan')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pengaturan</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Info Akun & Ganti Password */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold flex items-center text-gray-900">
                <Mail className="h-5 w-5 mr-3 text-blue-600" />
                Informasi Akun
              </h2>
            </div>
            <div className="p-6 sm:p-8">
              <div className="space-y-2">
                <Label className="text-gray-500 text-sm font-medium">Email yang Terdaftar</Label>
                <div className="font-semibold text-gray-900 text-lg">{userEmail}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold flex items-center text-gray-900">
                <KeyRound className="h-5 w-5 mr-3 text-blue-600" />
                Ganti Password
              </h2>
            </div>
            <div className="p-6 sm:p-8">
              <form onSubmit={handleUpdatePassword} className="space-y-5 max-w-md">
                <div className="space-y-2 relative">
                  <Label htmlFor="new_password" className="text-gray-700 font-medium">Password Baru</Label>
                  <div className="relative">
                    <Input 
                      id="new_password" 
                      type={showPassword ? "text" : "password"} 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="pr-10 h-11"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {newPassword.length > 0 && (
                    <div className="pt-1 space-y-1.5 animate-in fade-in slide-in-from-top-1">
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full transition-all duration-300 ease-out rounded-full", strength.color, strength.w)}
                        />
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className={cn(
                          "font-medium",
                          strength.score === 1 ? "text-red-600" : strength.score === 2 ? "text-yellow-600" : "text-green-600"
                        )}>
                          {strength.text}
                        </span>
                        {strength.score === 1 && <span className="text-gray-500">Gunakan kombinasi angka/huruf besar</span>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 relative">
                  <Label htmlFor="confirm_password" className="text-gray-700 font-medium">Konfirmasi Password Baru</Label>
                  <div className="relative flex items-center">
                    <Input 
                      id="confirm_password" 
                      type={showPassword ? "text" : "password"} 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={cn(
                        "pr-10 h-11 transition-colors",
                        isMatch ? "border-green-500 focus-visible:ring-green-500" : isMismatch ? "border-red-500 focus-visible:ring-red-500" : ""
                      )}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {isMatch && <CheckCircle2 className="h-5 w-5 text-green-500 animate-in zoom-in" />}
                      {isMismatch && <XCircle className="h-5 w-5 text-red-500 animate-in zoom-in" />}
                    </div>
                  </div>
                  {isMismatch && (
                    <p className="text-sm text-red-600 mt-1 animate-in slide-in-from-top-1">Password tidak sama.</p>
                  )}
                </div>

                <div className="pt-2">
                  <Button 
                    type="submit" 
                    disabled={!isFormValid}
                    className={cn(
                      "w-full sm:w-auto h-11 px-8 font-medium transition-all",
                      isFormValid ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md" : "bg-gray-100 text-gray-400"
                    )}
                  >
                    {isUpdating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                    {isUpdating ? 'Menyimpan...' : 'Simpan Password Baru'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Preferensi & Logout */}
        <div className="lg:col-span-1 space-y-6">


          <div className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-red-50 bg-red-50/50">
              <h2 className="text-lg font-semibold flex items-center text-red-700">
                <LogOut className="h-5 w-5 mr-3" />
                Keluar Aplikasi
              </h2>
            </div>
            <div className="p-6 sm:p-8">
              <p className="text-gray-500 mb-6 text-sm">Sesi Anda akan diakhiri. Anda harus login kembali untuk mengakses data kasbon.</p>
              <Button 
                type="button" 
                variant="destructive" 
                className="w-full sm:w-auto shadow-sm"
                onClick={() => setIsLogoutDialogOpen(true)}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Keluar (Logout)
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <LogOut className="h-5 w-5" /> Konfirmasi Keluar
            </DialogTitle>
            <DialogDescription>
              Yakin ingin keluar dari akun ini? Anda harus memasukkan email dan password lagi untuk masuk kembali.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-2 mt-6">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setIsLogoutDialogOpen(false)}>
              Batal
            </Button>
            <form action={logout} className="w-full sm:w-auto">
              <Button type="submit" variant="destructive" className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white">
                Ya, Keluar
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
