declare module "iyzipay" {
  interface IyzipayOptions {
    apiKey: string;
    secretKey: string;
    uri: string;
  }

  class Iyzipay {
    constructor(options: IyzipayOptions);
    checkoutFormInitialize: {
      create(request: Record<string, unknown>, callback: (err: unknown, result: any) => void): void;
    };
    checkoutForm: {
      retrieve(request: Record<string, unknown>, callback: (err: unknown, result: any) => void): void;
    };
  }

  export default Iyzipay;
}
