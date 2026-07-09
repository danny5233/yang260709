export default async function HomePage() {
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;

  let title = "預設大標題";
  let description = "預設介紹文字";

  try {
    const response = await fetch(
      `https://cdn.contentful.com/spaces/${spaceId}/environments/master/entries?content_type=homepage`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (response.ok) {
      const data = await response.json();
      if (data.items.length > 0) {
        title = data.items[0].fields.title;
        description = data.items[0].fields.description;
      }
    }
  } catch (e) {
    console.error(e);
  }

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", textAlign: "center" }}>
      <h1 style={{ fontSize: "3rem", marginBottom: "20px" }}>{title}</h1>
      <p style={{ fontSize: "1.2rem", color: "#666" }}>{description}</p>
    </div>
  );
}
