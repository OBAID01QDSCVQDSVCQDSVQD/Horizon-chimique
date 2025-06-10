'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import useCartStore from '@/hooks/use-cart-store'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { useSession } from 'next-auth/react'

export default function CheckoutPage() {
  const {
    cart: { items, itemsPrice },
    clearCart,
  } = useCartStore()

  const router = useRouter()
  const { data: session } = useSession()
  const userId = session?.user?.id

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  })

  // متغير التحقق من اكتمال الحقول الإلزامية
  const isFormValid =
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    formData.phone.trim() &&
    formData.address.trim();

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted!');
    setLoading(true);
    // تحقق من اكتمال الحقول الإلزامية
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.phone ||
      !formData.address
    ) {
      toast.error('Veuillez remplir tous les champs obligatoires : Prénom, Nom, Téléphone, Adresse.');
      setLoading(false);
      return;
    }
    // اطبع بيانات الشحن المرسلة
    const shippingDataToSend = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      city: formData.city,
      postalCode: formData.postalCode,
      country: formData.country,
    };
    console.log('Shipping data sent:', shippingDataToSend);
    console.log('Cart items with attributes:', JSON.stringify(items.map(item => ({
      name: item.name,
      attributes: (item as any).attributes
    })), null, 2));
    console.log({
      shippingData: shippingDataToSend,
      cartItems: items,
      totalPrice: itemsPrice,
    });
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shippingData: shippingDataToSend,
          cartItems: items,
          totalPrice: itemsPrice,
          userId,
        }),
      });

      let data = null;
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = {};
      }

      if (!response.ok) {
        // اطبع رسالة الخطأ القادمة من السيرفر
        console.log('API error:', data);
        // معالجة أخطاء الستوك
        if (data.error && data.error.includes('STOCK_ERROR')) {
          const stockError = JSON.parse(data.error);
          const errorMessages = stockError.items.map((item: any) => 
            `${item.name} : Stock insuffisant. Disponible : ${item.message.match(/\d+/)}`
          ).join('\n');
          toast.error(errorMessages);
        } else {
          toast.error(data.error || 'Une erreur est survenue lors de la commande.');
        }
        return;
      }

      // نجاح الطلب
      toast.success('Votre commande a été créée avec succès !');
      clearCart();
      router.push('/thank-you');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Une erreur est survenue lors de la création de la commande');
    } finally {
      setLoading(false);
    }
  };

  console.log('checkout items:', items)
  console.log('cartItemsWithDetails:', items)
  console.log('isFormValid:', isFormValid);

  return (
    <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
      <form onSubmit={handleSubmit} className="md:col-span-2 space-y-6">
        <h1 className="text-2xl font-bold">Paiement</h1>
        <Card>
          <CardHeader className="text-lg font-semibold">Informations de livraison</CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Prénom"
              name="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
              required
            />
            <Input
              placeholder="Nom"
              name="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
              required
            />
            <Input
              placeholder="Adresse e-mail"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
              required
            />
            <Input
              placeholder="Numéro de téléphone"
              name="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
              required
            />
            <Input
              placeholder="Adresse"
              name="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
              required
            />
            <Input
              placeholder="Ville"
              name="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
            />
            <Input
              placeholder="Code postal"
              name="postalCode"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
            />
            <Input
              placeholder="Pays"
              name="country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
            />
          </CardContent>
        </Card>
        <Button
          className="w-full rounded-full text-white bg-orange-500 hover:bg-orange-600 mt-2"
          type="submit"
          disabled={loading || !isFormValid}
        >
          Commander
        </Button>
        {!isFormValid && (
          <div className="text-red-500 text-center mt-2 text-sm">
            Veuillez remplir tous les champs obligatoires : Prénom, Nom, Téléphone, Adresse.
          </div>
        )}
      </form>

      <div className="space-y-6">
        <Card>
          <CardHeader className="text-lg font-semibold">Review Your Cart</CardHeader>
          <CardContent className="space-y-4">
            {items.length === 0 ? (
              <p className="text-gray-500">Your cart is empty.</p>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.clientId} className="flex gap-4 items-center border-b pb-2">
                    <div className="w-16 h-16 relative">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-contain rounded"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity}
                        {(item as any).attributes && (item as any).attributes.length > 0 && (
                          <>
                            {(item as any).attributes.map((attr: any, idx: number) => (
                              <span key={idx}>
                                {' - '}
                                {attr.attribute}: {attr.value}
                              </span>
                            ))}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-400">${item.price.toFixed(2)} ea</p>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-4 font-semibold text-lg">
                  <span>Total</span>
                  <span>${itemsPrice.toFixed(2)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-sm text-gray-500 text-center">
          🔒 Secure Checkout - SSL Encrypted
        </div>
      </div>
    </div>
  )
}
