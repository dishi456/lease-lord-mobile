import { ScrollView, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { Screen, Card, H2, Muted, Body, Badge, Row, Loading, ErrorText, shortDate } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api } from "@/lib/api";
import { authedImageUri } from "@/lib/openFile";
import { radius } from "@/lib/theme";

export default function MaintenanceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error } = useAsync(() => api.maintenanceDetail(id), [id]);

  if (loading) return <Loading />;
  if (error || !data) return (
    <Screen><ErrorText>{error || "Not found."}</ErrorText></Screen>
  );

  return (
    <Screen>
      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <H2>{data.title}</H2>
          <Badge label={data.status} />
        </View>
        <Muted>{data.property.name}</Muted>
      </Card>

      <Card>
        <Body>{data.description}</Body>
      </Card>

      <Card>
        <Row label="Priority" value={data.priority} />
        <Row label="Reported" value={shortDate(data.createdAt)} />
        {data.assignedTo ? <Row label="Assigned to" value={data.assignedTo} /> : null}
      </Card>

      {data.images.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {data.images.map((img) => (
            <Image key={img} source={{ uri: authedImageUri(img) }} style={{ width: 140, height: 140, borderRadius: radius.md }} contentFit="cover" />
          ))}
        </ScrollView>
      ) : null}
    </Screen>
  );
}
