import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaUsers, FaAward, FaShieldAlt, FaHeart } from 'react-icons/fa'

export const metadata: Metadata = {
  title: 'شنوا عنا - Horizon Chimique',
  description: 'تعرف على Horizon Chimique، شريكك الموثوق للمنتجات عالية الجودة والخدمة المتميزة.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">About Horizon Chimique</h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Your trusted partner for quality products and exceptional service since 2020
            </p>
            <div className="flex justify-center space-x-8">
              <div className="text-center">
                <div className="text-3xl font-bold">1000+</div>
                <div className="text-sm">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">500+</div>
                <div className="text-sm">Products</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">4.8</div>
                <div className="text-sm">Customer Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Our Mission</h2>
            <p className="text-lg text-gray-600 mb-6">
              At Horizon Chimique, we are committed to providing our customers with the highest quality products 
              and exceptional service. Our mission is to make premium products accessible to everyone while 
              maintaining the highest standards of quality and customer satisfaction.
            </p>
            <p className="text-lg text-gray-600">
              We believe in building long-term relationships with our customers through transparency, 
              reliability, and continuous improvement in everything we do.
            </p>
          </div>
          <div className="relative">
            <Image
              src="/images/banner1.jpg"
              alt="Our Mission"
              width={600}
              height={400}
              className="rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Our Values</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaHeart className="text-blue-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Passion</h3>
              <p className="text-gray-600">We are passionate about delivering excellence in every product and service.</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaShieldAlt className="text-green-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality</h3>
              <p className="text-gray-600">We never compromise on quality and always strive for the best.</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUsers className="text-purple-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Community</h3>
              <p className="text-gray-600">We value our community and work to strengthen it through our services.</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaAward className="text-orange-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Excellence</h3>
              <p className="text-gray-600">We pursue excellence in everything we do, from products to customer service.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Story */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <Image
              src="/images/banner2.jpg"
              alt="Our Story"
              width={600}
              height={400}
              className="rounded-lg shadow-lg"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Our Story</h2>
            <p className="text-lg text-gray-600 mb-6">
              Horizon Chimique was founded in 2020 with a simple vision: to provide high-quality products 
              that enhance people's lives. What started as a small local business has grown into a trusted 
              name in the industry, serving customers across Tunisia and beyond.
            </p>
            <p className="text-lg text-gray-600 mb-6">
              Our journey has been marked by continuous learning, adaptation, and growth. We've expanded 
              our product range, improved our services, and built lasting relationships with our customers 
              and partners.
            </p>
            <p className="text-lg text-gray-600">
              Today, we continue to innovate and evolve, always keeping our customers' needs at the heart 
              of everything we do.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Get In Touch</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaMapMarkerAlt className="text-blue-600 text-xl" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Address</h3>
              <p className="text-gray-600">Tunis, Tunisia</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaPhone className="text-green-600 text-xl" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Phone</h3>
              <p className="text-gray-600">+216 XX XXX XXX</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaEnvelope className="text-purple-600 text-xl" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Email</h3>
              <p className="text-gray-600">info@horizonchimique.com</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaClock className="text-orange-600 text-xl" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Hours</h3>
              <p className="text-gray-600">Mon-Fri: 9AM-6PM</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Experience Quality?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Discover our wide range of products and experience the Horizon Chimique difference today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/products" 
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-300"
            >
              Browse Products
            </Link>
            <Link 
              href="/contact" 
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition duration-300"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 