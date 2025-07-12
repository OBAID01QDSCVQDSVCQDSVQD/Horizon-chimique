'use client'
import BrowsingHistoryList from '@/components/shared/browsing-history-list'
import ProductPrice from '@/components/shared/product/product-price'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useCartStore from '@/hooks/use-cart-store'
import { APP_NAME, FREE_SHIPPING_MIN_PRICE } from '@/lib/constants'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'

export default function CartPage() {
  const {
    cart: { items, itemsPrice },
    updateItem,
    removeItem,
  } = useCartStore()
  const router = useRouter()

  // Log cart items for debugging
  console.log('cart items:', items)

  return (
    <div>
      <div className='grid grid-cols-1 md:grid-cols-4  md:gap-4'>
        {items.length === 0 ? (
          <Card className='col-span-4 rounded-none'>
            <CardHeader className='text-3xl  '>
              Votre panier est vide
            </CardHeader>
            <CardContent>
              Continuez vos achats sur <Link href='/'>{APP_NAME}</Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className='col-span-3'>
              <Card className='rounded-none'>
                <CardHeader className='text-3xl pb-0'>
                  Panier d'achat
                </CardHeader>
                <CardContent className='p-4'>
                  <div className='flex justify-end border-b mb-4'>Prix</div>

                  {items.map((item) => (
                    <div
                      key={item.clientId}
                      className='flex flex-col md:flex-row justify-between py-4 border-b gap-4'
                    >
                      <Link href={`/product/${item.slug}`}>
                        <div className='relative w-40 h-40'>
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes='20vw'
                            style={{
                              objectFit: 'contain',
                            }}
                          />
                        </div>
                      </Link>

                      <div className='flex-1 space-y-4'>
                        <Link
                          href={`/product/${item.slug}`}
                          className='text-lg hover:no-underline  '
                        >
                          {item.name}
                        </Link>
                        <div>
                          {Array.isArray((item as any).attributes) && (item as any).attributes.length > 0 ? (
                            <div className='flex flex-wrap gap-2'>
                              {(item as any).attributes.map((attr: any, idx: number) => (
                                <p key={idx} className='text-sm'>
                                  <span className='font-bold'>{attr.attribute}: </span>
                                  {attr.value}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <>
                              <p className='text-sm'>
                                <span className='font-bold'>Couleur: </span> {item.color}
                              </p>
                              <p className='text-sm'>
                                <span className='font-bold'>Taille: </span> {item.size}
                              </p>
                            </>
                          )}
                        </div>
                        <div className='flex gap-2 items-center'>
                          <Select
                            value={item.quantity.toString()}
                            onValueChange={(value) =>
                              updateItem(item, Number(value))
                            }
                          >
                            <SelectTrigger className='w-auto'>
                              <SelectValue>
                                Quantité: {item.quantity}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent position='popper'>
                              {Array.from({
                                length: item.countInStock,
                              }).map((_, i) => (
                                <SelectItem key={i + 1} value={`${i + 1}`}>
                                  {i + 1}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant={'outline'}
                            onClick={() => removeItem(item)}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </div>
                      <div>
                        <p className='text-right'>
                          {item.quantity > 1 && (
                            <>
                              {item.quantity} x
                              <ProductPrice price={item.price} plain />
                              <br />
                            </>
                          )}

                          <span className='font-bold text-lg'>
                            <ProductPrice
                              price={item.price * item.quantity}
                              plain
                            />
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className='flex justify-end text-lg my-2'>
                    Sous-total (
                    {items.reduce((acc, item) => acc + item.quantity, 0)}{' '}
                    articles):{' '}
                    <span className='font-bold ml-1'>
                      <ProductPrice price={itemsPrice} plain />
                    </span>{' '}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <Card className='rounded-none'>
                <CardContent className='py-4 space-y-4'>
                  {itemsPrice < FREE_SHIPPING_MIN_PRICE ? (
                    <div className='flex-1'>
                      Ajoutez{' '}
                      <span className='text-green-700'>
                        <ProductPrice
                          price={FREE_SHIPPING_MIN_PRICE - itemsPrice}
                          plain
                        />
                      </span>{' '}
                      d'articles éligibles à votre commande pour bénéficier de la livraison GRATUITE
                    </div>
                  ) : (
                    <div className='flex-1'>
                      <span className='text-green-700'>
                        Votre commande est éligible à la livraison GRATUITE
                      </span>{' '}
                      Choisissez cette option lors du paiement
                    </div>
                  )}
                  <div className='text-lg'>
                    Sous-total (
                    {items.reduce((acc, item) => acc + item.quantity, 0)}{' '}
                    articles):{' '}
                    <span className='font-bold'>
                      <ProductPrice price={itemsPrice} plain />
                    </span>{' '}
                  </div>
                  <Button
                    onClick={() => router.push('/checkout')}
                    className='rounded-full w-full'
                  >
                    Procéder au paiement
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
      <BrowsingHistoryList className='mt-10' />
    </div>
  )
}