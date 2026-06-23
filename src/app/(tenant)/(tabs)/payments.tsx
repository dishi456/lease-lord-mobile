import { RefreshControl, View } from "react-native";
import { Screen, Card, H2, Muted, Body, Badge, Loading, ErrorText, Empty, money, shortDate } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api, type Invoice, type Payment } from "@/lib/api";

export default function Payments() {
  const invoicesQ = useAsync(() => api.invoices());
  const paymentsQ = useAsync(() => api.payments());

  if (invoicesQ.loading && paymentsQ.loading) return <Loading />;

  const invoices = invoicesQ.data?.items ?? [];
  const payments = paymentsQ.data?.items ?? [];
  const refreshing = invoicesQ.refreshing || paymentsQ.refreshing;

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            invoicesQ.refresh();
            paymentsQ.refresh();
          }}
        />
      }
    >
      <H2>Invoices</H2>
      <ErrorText>{invoicesQ.error}</ErrorText>
      {invoices.length === 0 ? (
        <Empty title="No invoices" subtitle="Rent invoices will appear here." />
      ) : (
        invoices.map((i) => <InvoiceRow key={i.id} i={i} />)
      )}

      <View style={{ height: 8 }} />
      <H2>Payment history</H2>
      <ErrorText>{paymentsQ.error}</ErrorText>
      {payments.length === 0 ? (
        <Empty title="No payments yet" />
      ) : (
        payments.map((p) => <PaymentRow key={p.id} p={p} />)
      )}
    </Screen>
  );
}

function InvoiceRow({ i }: { i: Invoice }) {
  return (
    <Card>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View>
          <Body style={{ fontWeight: "700" }}>{money(i.amount)}</Body>
          <Muted>Due {shortDate(i.dueDate)}</Muted>
        </View>
        <Badge label={i.status} />
      </View>
    </Card>
  );
}

function PaymentRow({ p }: { p: Payment }) {
  return (
    <Card>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View>
          <Body style={{ fontWeight: "700" }}>{money(p.amount)}</Body>
          <Muted>
            {p.method.replace(/_/g, " ")} · {p.paidAt ? shortDate(p.paidAt) : shortDate(p.createdAt)}
          </Muted>
        </View>
        <Badge label={p.status} />
      </View>
    </Card>
  );
}
