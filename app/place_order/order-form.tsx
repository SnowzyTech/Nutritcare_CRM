"use client";

import { useState } from "react";
import { createMockOrderAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, ShoppingCart, User, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  name: string;
  sellingPrice: number | any;
  sku: string;
}

export default function OrderForm({ products }: { products: Product[] }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deliveryAddress: "",
    state: "",
    lga: "",
  });

  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: "", quantity: 1 },
  ]);

  const addItem = () => {
    setItems([...items, { productId: "", quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: "productId" | "quantity", value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((acc, item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        return acc + Number(product.sellingPrice) * item.quantity;
      }
      return acc;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    setSuccess(null);

    // Basic validation
    if (!formData.customerName || !formData.customerPhone || !formData.deliveryAddress) {
      setError("Please fill in all required fields.");
      setIsPending(false);
      return;
    }

    if (items.some((item) => !item.productId)) {
      setError("Please select a product for all items.");
      setIsPending(false);
      return;
    }

    const result = await createMockOrderAction({
      ...formData,
      items: items,
    });

    if (result.success) {
      setSuccess(`Order ${result.orderNumber} placed successfully!`);
      // Reset form
      setFormData({
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        deliveryAddress: "",
        state: "",
        lga: "",
      });
      setItems([{ productId: "", quantity: 1 }]);
    } else {
      setError(result.error || "Something went wrong.");
    }
    setIsPending(false);
  };

  if (success) {
    return (
      <Card className="max-w-2xl mx-auto border-2 border-primary/20 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="h-2 bg-primary w-full" />
        <CardContent className="pt-12 pb-12 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-3xl font-bold mb-4">Order Received!</CardTitle>
          <CardDescription className="text-lg mb-8">
            {success} Our team will contact you shortly to confirm your delivery.
          </CardDescription>
          <Button 
            onClick={() => setSuccess(null)}
            className="rounded-full px-8 py-6 text-lg h-auto"
          >
            Place Another Order
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Hero Section */}
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
          Secure Your Order
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Experience premium wellness. Fill out the details below and we'll handle the rest.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Customer Details */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center space-x-3 pb-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <User size={20} />
              </div>
              <div>
                <CardTitle className="text-xl">Contact Information</CardTitle>
                <CardDescription>Tell us who you are</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name *</label>
                  <Input 
                    placeholder="e.g. John Doe" 
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    className="bg-background/50 border-primary/10 focus-visible:ring-primary"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number *</label>
                  <Input 
                    placeholder="e.g. 08012345678" 
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                    className="bg-background/50 border-primary/10 focus-visible:ring-primary"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address (Optional)</label>
                <Input 
                  type="email" 
                  placeholder="e.g. john@example.com" 
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                  className="bg-background/50 border-primary/10 focus-visible:ring-primary"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center space-x-3 pb-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <MapPin size={20} />
              </div>
              <div>
                <CardTitle className="text-xl">Delivery Address</CardTitle>
                <CardDescription>Where should we send it?</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Address *</label>
                <Textarea 
                  placeholder="Street name, house number, nearest landmark..." 
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData({...formData, deliveryAddress: e.target.value})}
                  className="bg-background/50 border-primary/10 focus-visible:ring-primary min-h-[100px]"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">State *</label>
                  <Input 
                    placeholder="e.g. Lagos" 
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    className="bg-background/50 border-primary/10 focus-visible:ring-primary"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">LGA *</label>
                  <Input 
                    placeholder="e.g. Ikeja" 
                    value={formData.lga}
                    onChange={(e) => setFormData({...formData, lga: e.target.value})}
                    className="bg-background/50 border-primary/10 focus-visible:ring-primary"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Order Items & Summary */}
        <div className="space-y-6">
          <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm sticky top-6">
            <CardHeader className="flex flex-row items-center space-x-3 pb-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <ShoppingCart size={20} />
              </div>
              <div>
                <CardTitle className="text-xl">Products</CardTitle>
                <CardDescription>What are you buying?</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {items.map((item, index) => (
                <div key={index} className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border/50 relative group transition-all hover:bg-muted/50">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Product</label>
                    <Select
                      value={item.productId}
                      onValueChange={(val) => updateItem(index, "productId", val ?? "")}
                    >
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Choose a product..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} - ₦{Number(p.sellingPrice).toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quantity</label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value))}
                        className="bg-background/50"
                      />
                    </div>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-6 text-destructive hover:bg-destructive/10"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 size={18} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed border-primary/30 text-primary hover:bg-primary/5 rounded-xl h-12"
                onClick={addItem}
              >
                <Plus size={18} className="mr-2" /> Add Item
              </Button>

              <div className="pt-6 mt-6 border-t border-border/50 space-y-3">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₦{calculateTotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Delivery</span>
                  <span className="text-green-500 font-medium">Calculated later</span>
                </div>
                <div className="flex justify-between items-center text-xl font-bold pt-2">
                  <span>Total</span>
                  <span className="text-primary">₦{calculateTotal().toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button 
                type="submit" 
                className="w-full h-14 rounded-full text-lg font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]" 
                disabled={isPending}
              >
                {isPending ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2">◌</span> Processing...
                  </span>
                ) : (
                  "Confirm Order"
                )}
              </Button>
            </CardFooter>
            {error && (
              <div className="mx-6 mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm flex items-start space-x-2 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </Card>
        </div>
      </div>
    </form>
  );
}
