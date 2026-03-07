declare module 'liteapi-node-sdk' {
  interface LiteApiInstance {
    getHotelsRates(params: Record<string, unknown>): Promise<unknown>
    getHotel(params: { hotelId: string }): Promise<unknown>
    getHotelReviews(params: { hotelId: string; limit?: number }): Promise<unknown>
    getPlaces(params: { textQuery: string }): Promise<unknown>
    preBookRate(params: Record<string, unknown>): Promise<unknown>
    book(params: Record<string, unknown>): Promise<unknown>
    getBooking(params: { bookingId: string }): Promise<unknown>
    cancelBooking(params: { bookingId: string }): Promise<unknown>
    getHotelsMinRates(params: Record<string, unknown>): Promise<unknown>
  }

  function LiteApi(apiKey: string): LiteApiInstance
  export = LiteApi
}
