"use client";

import { useState } from "react";
import useCartStore from "@/hooks/use-cart-store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const ShippingInfoForm = () => {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    console.log("userId sent from client:", userId);
    console.log("session from client:", session);

    const cartItems = useCartStore((state) => state.cart.items);
    const totalPrice = cartItems.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
    );

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        postalCode: "",
        country: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (value: string) => {
        setFormData((prev) => ({ ...prev, country: value }));
    };
    const clearCart = useCartStore((state) => state.clearCart);
    const router = useRouter();

    const handleSubmit = async () => {
        try {
            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    shippingData: formData,
                    cartItems: cartItems,
                    totalPrice: totalPrice,
                    userId: "534524242512224",
                }),
            });

            if (!res.ok) throw new Error("Checkout failed");

            const result = await res.json();
            console.log("✅ Order created:", result.order);

            // مثال على success message
            alert("✔️ Order placed successfully!");

            clearCart();
            router.push("/thank-you");
            router.refresh();
        } catch (err) {
            console.error("❌ Error during checkout:", err);
            alert("حدث خطأ أثناء إرسال الطلب.");
        }
    };

    return (
        <Card className="p-6 rounded-2xl shadow-md space-y-4 border border-gray-200">
            <CardHeader className="pb-2">
                <h2 className="text-2xl font-semibold text-gray-800">📦 Shipping Information</h2>
                <p className="text-sm text-gray-500">Please enter your delivery details accurately.</p>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label htmlFor="firstName">First Name</label>
                    <Input id="firstName" name="firstName" placeholder="John" value={formData.firstName} onChange={handleChange} />
                    <label htmlFor="lastName">Last Name</label>
                    <Input id="lastName" name="lastName" placeholder="Doe" value={formData.lastName} onChange={handleChange} />
                    <label htmlFor="phone">Phone Number</label>
                    <Input id="phone" name="phone" placeholder="+216 99 999 999" value={formData.phone} onChange={handleChange} />
                    <label htmlFor="email">Email</label>
                    <Input id="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} />
                </div>
                <label htmlFor="address">Address</label>
                <Input id="address" name="address" placeholder="123 Main Street" value={formData.address} onChange={handleChange} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="city">City</label>
                        <Input id="city" name="city" placeholder="Tunis" value={formData.city} onChange={handleChange} />
                    </div>
                    <div>
                        <label htmlFor="postalCode">Postal Code</label>
                        <Input id="postalCode" name="postalCode" placeholder="1000" value={formData.postalCode} onChange={handleChange} />
                    </div>
                    <div>
                        
                        <label htmlFor="country">Country</label>
                        <Select onValueChange={handleSelectChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Country" />
                            </SelectTrigger>
                            <SelectContent>
                            
                                <SelectItem value="tn">Tunisia</SelectItem>
                                <SelectItem value="dz">Algeria</SelectItem>
                                <SelectItem value="ma">Morocco</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <button
                    onClick={handleSubmit}
                    className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    Confirm Shipping Info
                    
                </button>
                
            </CardContent>
        </Card>
    );
};

export default ShippingInfoForm;
