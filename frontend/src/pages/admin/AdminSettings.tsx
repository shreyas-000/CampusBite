import { useState, useEffect } from 'react'
import { Store, Clock, Zap } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

export default function AdminSettings() {
  const [isOpen, setIsOpen] = useState(true)
  const [openTime, setOpenTime] = useState('08:00')
  const [closeTime, setCloseTime] = useState('22:00')
  const [maxOrders, setMaxOrders] = useState('50')
  const [isSaving, setIsSaving] = useState(false)

  // In a real app, you would fetch these settings from an API endpoint on mount
  useEffect(() => {
    // Mock fetching settings
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Mock API call to save settings
      await new Promise(resolve => setTimeout(resolve, 800))
      toast.success('Settings saved successfully')
    } catch (e) {
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground mt-1">Configure global canteen parameters</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            <CardTitle>Canteen Status</CardTitle>
          </div>
          <CardDescription>Manually override the canteen's open/close status.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold">Accepting Orders</Label>
              <p className="text-sm text-muted-foreground">
                When disabled, students cannot place new orders, but active orders can still be processed.
              </p>
            </div>
            <Switch checked={isOpen} onCheckedChange={setIsOpen} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <CardTitle>Business Hours</CardTitle>
          </div>
          <CardDescription>Set the default operating hours for the canteen.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="openTime">Opening Time</Label>
              <Input 
                id="openTime" 
                type="time" 
                value={openTime} 
                onChange={(e) => setOpenTime(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closeTime">Closing Time</Label>
              <Input 
                id="closeTime" 
                type="time" 
                value={closeTime} 
                onChange={(e) => setCloseTime(e.target.value)} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <CardTitle>Order Limits</CardTitle>
          </div>
          <CardDescription>Prevent the kitchen from being overwhelmed during peak hours.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="maxOrders">Max Concurrent Active Orders</Label>
            <Input 
              id="maxOrders" 
              type="number" 
              value={maxOrders} 
              onChange={(e) => setMaxOrders(e.target.value)} 
            />
            <p className="text-xs text-muted-foreground pt-1">
              If active orders exceed this number, checkout will be temporarily paused.
            </p>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/20 border-t px-6 py-4 mt-6">
          <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
            {isSaving ? 'Saving Changes...' : 'Save All Settings'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
