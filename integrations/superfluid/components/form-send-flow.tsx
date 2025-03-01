'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useAccount, useSigner } from 'wagmi'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { useSuperFluidWithWagmiProvider } from '../hooks/use-superfluid-with-wagmi-provider'
import { getPerSecondFlowRate } from '../utils/getPerSecondFlowRate'

const formSchema = z.object({
  receiver: z.string().min(42).max(42),
  token: z.string({
    required_error: 'Please select a Supertoken to stream',
  }),
  amount: z.string(),
})

export default function App() {
  const signer = useSigner()
  const account = useAccount()

  const sf = useSuperFluidWithWagmiProvider()
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      receiver: '',
      token: '',
      amount: '',
    },
  })

  // 2. Define a submit handler.
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values)

    const weiAmount = getPerSecondFlowRate(values.amount)
    console.log(weiAmount, 'weiAmount')
    if (!sf || !signer?.data) return
    const supertoken = await sf.loadSuperToken(values.token)

    let flowOp = supertoken?.createFlow({
      sender: account.address,
      receiver: values.receiver,
      flowRate: weiAmount,
    })

    await flowOp?.exec(signer?.data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="receiver"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Receiver</FormLabel>
              <FormControl>
                <Input placeholder="ethereum address here" {...field} />
              </FormControl>
              <FormDescription> This is the receivers valid EVM address. </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="token"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supertoken</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Supertoken to stream" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="USDCx">USDCx</SelectItem>
                  <SelectItem value="DAIx">DAIx</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Select a Supertoken to stream.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (Monthly)</FormLabel>
              <FormControl>
                <Input placeholder="100 / month" {...field} />
              </FormControl>
              <FormDescription> Amount to stream to receiver, monthly. </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
