# Prototype

```typescript
const prismaAppSync = new PrismaAppSync()

export const main = async (event: any, context: any) => {
    return await prismaAppSync.resolve({
        event,
        runtime: {
            'parent:getListing,listing': {
                omit: ['label', 'googleMapsUrl', 'bookingHotelUrl', 'categories', 'signature'],
                select: {
                    name: true,
                    description: true,
                    city: true,
                    countryCode: true,
                    address: true,
                    lat: true,
                    lng: true,
                    categoriesIds: true,
                    images: { select: { cdnUrl: true } },
                },
                inject: (result) => {
                    return await superchargeListingOutput(result)
                }
            },
        }
    })
}
```
