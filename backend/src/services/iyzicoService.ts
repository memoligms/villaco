import Iyzipay from "iyzipay";
import { env } from "../config/env";

const iyzipay = new Iyzipay({
  apiKey: env.iyzico.apiKey,
  secretKey: env.iyzico.secretKey,
  uri: env.iyzico.baseUrl,
});

export interface InitiateCheckoutParams {
  conversationId: string;
  price: number;
  basketId: string;
  callbackUrl: string;
  buyer: {
    id: string;
    name: string;
    surname: string;
    email: string;
    gsmNumber: string;
    identityNumber: string;
    ip: string;
  };
  basketItemName: string;
}

export interface CheckoutFormResult {
  status: string;
  checkoutFormContent?: string;
  paymentPageUrl?: string;
  token?: string;
  errorMessage?: string;
  raw: unknown;
}

export function initiateCheckoutForm(params: InitiateCheckoutParams): Promise<CheckoutFormResult> {
  const request = {
    locale: "tr",
    conversationId: params.conversationId,
    price: params.price.toFixed(2),
    paidPrice: params.price.toFixed(2),
    currency: "USD",
    basketId: params.basketId,
    paymentGroup: "PRODUCT",
    callbackUrl: params.callbackUrl,
    buyer: {
      id: params.buyer.id,
      name: params.buyer.name,
      surname: params.buyer.surname,
      gsmNumber: params.buyer.gsmNumber,
      email: params.buyer.email,
      identityNumber: params.buyer.identityNumber,
      registrationAddress: "Belirtilmedi",
      ip: params.buyer.ip,
      city: "Belirtilmedi",
      country: "Turkey",
    },
    shippingAddress: {
      contactName: `${params.buyer.name} ${params.buyer.surname}`,
      city: "Belirtilmedi",
      country: "Turkey",
      address: "Belirtilmedi",
    },
    billingAddress: {
      contactName: `${params.buyer.name} ${params.buyer.surname}`,
      city: "Belirtilmedi",
      country: "Turkey",
      address: "Belirtilmedi",
    },
    basketItems: [
      {
        id: params.basketId,
        name: params.basketItemName,
        category1: "Konaklama",
        itemType: "VIRTUAL",
        price: params.price.toFixed(2),
      },
    ],
  };

  return new Promise((resolve, reject) => {
    iyzipay.checkoutFormInitialize.create(request, (err: unknown, result: any) => {
      if (err) return reject(err);
      resolve({
        status: result.status,
        checkoutFormContent: result.checkoutFormContent,
        paymentPageUrl: result.paymentPageUrl,
        token: result.token,
        errorMessage: result.errorMessage,
        raw: result,
      });
    });
  });
}

export function retrieveCheckoutForm(token: string): Promise<CheckoutFormResult> {
  return new Promise((resolve, reject) => {
    iyzipay.checkoutForm.retrieve({ locale: "tr", token }, (err: unknown, result: any) => {
      if (err) return reject(err);
      resolve({
        status: result.status,
        token: result.token,
        errorMessage: result.errorMessage,
        raw: result,
      });
    });
  });
}
