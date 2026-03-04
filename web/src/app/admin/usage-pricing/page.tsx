'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { adminApiEndpoints } from '@/lib/api/admin-client';
import { getErrorMessage } from '@/lib/utils/error';

const schema = z.object({
  price_per_org: z.coerce.number().min(0),
  price_per_apartment: z.coerce.number().min(0),
  price_per_room: z.coerce.number().min(0),
  price_per_member: z.coerce.number().min(0),
});

type FormData = z.infer<typeof schema>;

export default function AdminUsagePricingPage() {
  const queryClient = useQueryClient();
  const {
    data: pricing,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['admin', 'usage-pricing'],
    queryFn: async () => {
      const res = await adminApiEndpoints.getUsagePricing();
      return res.data;
    },
    retry: false,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    values:
      pricing && !isError
        ? {
            price_per_org: Number(pricing.price_per_org ?? 0),
            price_per_apartment: Number(pricing.price_per_apartment ?? 0),
            price_per_room: Number(pricing.price_per_room ?? 0),
            price_per_member: Number(pricing.price_per_member ?? 0),
          }
        : undefined,
    defaultValues: {
      price_per_org: 0,
      price_per_apartment: 0,
      price_per_room: 0,
      price_per_member: 0,
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => adminApiEndpoints.updateUsagePricing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'usage-pricing'] });
      toast.success('已保存');
    },
    onError: (error) => toast.error(getErrorMessage(error, '保存失败，请重试')),
  });

  if (isLoading && !pricing && !isError) {
    return (
      <div className="mx-auto max-w-xl">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <h2 className="mb-4 text-xl font-semibold">按量定价</h2>
      <Card>
        <CardHeader>
          <CardTitle>组织 / 公寓 / 房间 / 成员单价</CardTitle>
          <CardDescription>单位：元/个/年，用户按量购买时按此价格计费</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((d) => updateMutation.mutate(d))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="price_per_org"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>组织单价（元/个/年）</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price_per_apartment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>公寓单价（元/个/年）</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price_per_room"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>房间单价（元/个/年）</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price_per_member"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>成员单价（元/个/年）</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? '保存中…' : '保存'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
