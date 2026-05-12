import { getActiveProducts } from "@/modules/orders/services/products.service";
import OrderForm from "./order-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Place Your Order | Nutritcare",
  description: "Securely place your order for premium Nutritcare wellness products.",
};

export default async function PlaceOrderPage() {
  const products = await getActiveProducts();

  return (
    <main className="min-h-screen bg-[#f8f9fa] dark:bg-[#030712] relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-purple-500/5 blur-[100px] rounded-full" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-blue-500/5 blur-[150px] rounded-full" />
      </div>

      <div className="container relative z-10 mx-auto px-4 py-16 sm:py-24">
        <OrderForm products={products} />
      </div>
      
      {/* Footer */}
      <footer className="relative z-10 border-t border-border/40 bg-background/50 backdrop-blur-md py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} Nutritcare. All rights reserved.</p>
          <p className="mt-2 font-medium text-primary/60">Premium Wellness Solutions</p>
        </div>
      </footer>
    </main>
  );
}
