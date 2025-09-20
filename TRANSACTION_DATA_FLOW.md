# Transaction Data Flow & Chart Integration

## Overview
This document explains how earnings and transaction data flows through the system to populate the admin dashboard charts.

## Data Flow Process

### 1. Booking Creation
- User creates a booking through the booking system
- Booking is stored in the `bookings` table with status `pending`
- Booking includes: `total_amount`, `user_id`, `station_id`, `power_bank_type_id`

### 2. Payment Confirmation (Admin Action)
When admin confirms a payment in the admin dashboard:

```typescript
// 1. Update booking status to 'confirmed'
await supabase.from('bookings').update({ status: 'confirmed' })

// 2. Create rental record
const { data: rentalData } = await supabase.from('rentals').insert({
  user_id: booking.user_id,
  station_id: booking.station_id,
  power_bank_type_id: booking.power_bank_type_id,
  start_time: startTime.toISOString(),
  end_time: endTime.toISOString(),
  status: 'active',
  total_amount: booking.total_amount  // ✅ Amount stored in rental
}).select().single()

// 3. Create transaction record (NEW - This was missing!)
const { error: transactionError } = await supabase.from('transactions').insert({
  rental_id: rentalData.id,
  amount: booking.total_amount,        // ✅ Amount stored in transaction
  payment_method: 'bank_transfer',
  payment_reference: booking.order_id,
  status: 'completed'                  // ✅ Completed status for charts
})

// 4. Update inventory
// 5. Refresh chart data
refetchData() // ✅ This updates the charts
```

### 3. Chart Data Retrieval
The `useAdminData` hook fetches data for charts:

```typescript
// Fetch all transactions
const fetchTransactions = async () => {
  const { data } = await supabase
    .from('transactions')
    .select(`
      *,
      rental:rentals!transactions_rental_id_fkey(
        user_id,
        station:stations(name)
      )
    `)
    .order('created_at', { ascending: false })
}

// Fetch monthly earnings for charts
const fetchMonthlyEarnings = async () => {
  const { data } = await supabase
    .from('transactions')
    .select('amount, created_at')
    .eq('status', 'completed')  // ✅ Only completed transactions
    .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())

  // Group by month and calculate totals
  const monthlyMap = new Map()
  data?.forEach(transaction => {
    const month = new Date(transaction.created_at).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    })
    
    const current = monthlyMap.get(month) || { earnings: 0, transactions: 0 }
    monthlyMap.set(month, {
      earnings: current.earnings + Number(transaction.amount),  // ✅ Sum amounts
      transactions: current.transactions + 1                   // ✅ Count transactions
    })
  })
}
```

### 4. Chart Display
Charts use the processed data:

```typescript
// Monthly Earnings Chart
<LineChart data={monthlyData}>
  <Line dataKey="earnings" />  // ✅ Shows total earnings per month
</LineChart>

// Transaction Volume Chart  
<BarChart data={monthlyData}>
  <Bar dataKey="transactions" />  // ✅ Shows transaction count per month
</BarChart>
```

## Database Schema

### Transactions Table
```sql
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY,
    rental_id UUID REFERENCES public.rentals(id),
    amount DECIMAL(10, 2) NOT NULL,           -- ✅ Earnings amount
    payment_method TEXT DEFAULT 'opay',
    payment_reference TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Rentals Table
```sql
CREATE TABLE public.rentals (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    station_id UUID REFERENCES public.stations(id),
    power_bank_type_id UUID REFERENCES public.power_bank_types(id),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
    end_time TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    total_amount DECIMAL(10, 2),              -- ✅ Rental amount
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Key Fixes Applied

### 1. ✅ Transaction Creation
**Problem**: No transaction records were being created when payments were confirmed.
**Solution**: Added transaction creation in `handleConfirmPayment` function.

### 2. ✅ Chart Data Refresh
**Problem**: Charts weren't updating after new transactions.
**Solution**: Added `refetchData()` call after payment confirmation.

### 3. ✅ Proper Data Aggregation
**Problem**: Charts needed proper monthly aggregation.
**Solution**: Implemented month-based grouping and summation in `fetchMonthlyEarnings`.

### 4. ✅ Error Handling
**Problem**: Charts showed no feedback when no data was available.
**Solution**: Added helpful empty state messages in chart components.

## Data Integrity Checks

### Verify Transaction Creation
```sql
-- Check if transactions are being created
SELECT COUNT(*) as total_transactions FROM public.transactions;
SELECT COUNT(*) as completed_transactions FROM public.transactions WHERE status = 'completed';
```

### Verify Chart Data
```sql
-- Check monthly earnings data (what charts use)
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as transaction_count,
    SUM(amount) as total_earnings
FROM public.transactions 
WHERE status = 'completed'
AND created_at >= now() - interval '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;
```

### Verify Data Relationships
```sql
-- Check that transactions are properly linked to rentals
SELECT 
    t.id as transaction_id,
    t.amount,
    t.status,
    r.id as rental_id,
    r.total_amount as rental_amount
FROM public.transactions t
JOIN public.rentals r ON t.rental_id = r.id
ORDER BY t.created_at DESC
LIMIT 10;
```

## Testing the Flow

1. **Create a booking** through the user interface
2. **Confirm the payment** in the admin dashboard
3. **Check the database** for new transaction record
4. **Verify charts update** with new data
5. **Check totals** match the booking amount

## Expected Results

After confirming a payment:
- ✅ New rental record created with `total_amount`
- ✅ New transaction record created with `amount` and `status = 'completed'`
- ✅ Charts automatically refresh and show new data
- ✅ Monthly earnings increase by the transaction amount
- ✅ Transaction count increases by 1

## Troubleshooting

### Charts Still Empty?
1. Check if transactions exist: `SELECT COUNT(*) FROM transactions WHERE status = 'completed'`
2. Check admin permissions: Ensure admin user has `role = 'admin'`
3. Check RLS policies: Verify admin can view all transactions
4. Check date range: Ensure transactions are within last 12 months

### Data Not Updating?
1. Check `refetchData()` is being called after payment confirmation
2. Check for JavaScript errors in browser console
3. Verify database triggers are working
4. Check network requests in browser dev tools

## Summary

The transaction data flow is now complete and properly integrated:

1. **Bookings** → **Rentals** → **Transactions** → **Charts**
2. **Earnings totals** are properly stored and aggregated
3. **Transaction counts** are accurately tracked
4. **Charts update** automatically when new data is added
5. **Data integrity** is maintained through proper relationships

Your admin dashboard charts will now display real, live data from actual transactions!
