import Product, { IProduct } from '@/lib/db/models/product.model'
import { connectToDatabase } from '@/lib/db'
import Attribute from '@/lib/db/models/attribute.model'; // Import Attribute model
import mongoose from 'mongoose'; // Import mongoose to check for ObjectId

export async function getProductsByTag({
  tag,
  limit = 10,
}: {
  tag: string
  limit?: number
}) {
  await connectToDatabase()

  const products = await Product.find({
    tags: { $in: [tag] },
    isPublished: true,
  })
    .populate('attributes.attribute') // 💡 هذه هي الإضافة المهمة
    .sort({ createdAt: 'desc' })
    .limit(limit)

  return JSON.parse(JSON.stringify(products)) as IProduct[]
}

export async function getAllProducts() {
  await connectToDatabase()
  const products = await Product.find({}, { _id: 1, name: 1 }).lean()
  return products
}

export async function createProduct(data: any) {
  await connectToDatabase()
  let newProduct = new Product(data)

  let isUnique = false;
  let attempts = 0;
  const MAX_ATTEMPTS = 10; // لتجنب حلقة لا نهائية

  while (!isUnique && attempts < MAX_ATTEMPTS) {
    try {
      if (attempts > 0) {
        // إذا لم يكن فريدًا في المحاولة الأولى، أضف رقمًا عشوائيًا
        const randomString = Math.random().toString(36).substring(2, 8); // سلسلة عشوائية قصيرة
        newProduct.slug = `${data.slug}-${randomString}`;
      }
      await newProduct.save();
      isUnique = true;
    } catch (error: any) {
      if (error.code === 11000) { // خطأ تكرار المفتاح
        attempts++;
        // لا تفعل شيئًا، ستحاول الحلقة مرة أخرى بـ slug مختلف
      } else {
        throw error; // أخطاء أخرى يجب أن يتم طرحها
      }
    }
  }

  if (!isUnique) {
    throw new Error("Failed to create unique slug after multiple attempts.");
  }

  return JSON.parse(JSON.stringify(newProduct))
}

export async function getProductBySlug(slug: string) {
  await connectToDatabase();

  try {
    const product = await Product.findOne({ slug: slug })
      .populate({
        path: 'attributes.attribute',
        model: 'Attribute',
        select: 'name values' // Ensure name and values are fetched
      })
      .lean();

    if (!product) {
      console.log('Product not found for slug:', slug);
      return null;
    }

    // Manual population check and fix for attributes that might not have been populated correctly
    if (product.attributes && Array.isArray(product.attributes)) {
      console.log('DEBUG: Before manual attributes population. Product attributes:', product.attributes); // Added
      const populatedAttributesPromises = product.attributes.map(async (attrEntry: any) => {
        console.log('DEBUG: Processing attrEntry:', attrEntry); // Added

        // Case 1: Malformed old data { _id: "someId" }
        if (attrEntry._id && !attrEntry.attribute && mongoose.Types.ObjectId.isValid(attrEntry._id.toString())) {
          console.log('DEBUG: Matched Case 1 (malformed old data). attrEntry._id:', attrEntry._id); // Added
          const attributeId = attrEntry._id.toString();
          const populatedAttribute = await Attribute.findById(attributeId).select('name values').lean();
          
          console.log('DEBUG: PopulatedAttribute for Case 1:', populatedAttribute); // Added

          if (populatedAttribute) {
            // Trim attribute name and values when populating
            if (Array.isArray(populatedAttribute)) {
              // Handle case where populatedAttribute is an array (shouldn't happen with findById, but just in case)
              console.warn('populatedAttribute is unexpectedly an array:', populatedAttribute);
            } else {
              // Handle normal case where populatedAttribute is a single object
              populatedAttribute.name = populatedAttribute.name?.trim();
              populatedAttribute.values = populatedAttribute.values?.map((v: any) => ({ ...v, label: v.label?.trim() }));
            }

            const inferredValue = populatedAttribute.values && populatedAttribute.values.length > 0
                                  ? populatedAttribute.values[0].label
                                  : 'N/A';
            return {
              attribute: populatedAttribute,
              value: attrEntry.value?.trim() || inferredValue, // Trim value here as well
              ...(attrEntry.image && { image: attrEntry.image }),
              ...(attrEntry.price && { price: attrEntry.price }),
            };
          } else {
            console.log('DEBUG: PopulatedAttribute for Case 1 is null. Returning original attrEntry.'); // Added
            return attrEntry;
          }
        }
        // Case 2: attrEntry.attribute is an ObjectId but not populated by Mongoose
        else if (attrEntry.attribute && typeof attrEntry.attribute === 'object' && !('name' in attrEntry.attribute) && mongoose.Types.ObjectId.isValid((attrEntry.attribute as any)._id || attrEntry.attribute.toString())) {
            console.log('DEBUG: Matched Case 2 (attribute is ObjectId). attrEntry.attribute:', attrEntry.attribute); // Added
            const attributeId = (attrEntry.attribute as any)._id || attrEntry.attribute.toString();
            const populatedAttribute = await Attribute.findById(attributeId).select('name values').lean();
            if (populatedAttribute) {
              // Trim attribute name and values when populating
              if (Array.isArray(populatedAttribute)) {
                console.warn('populatedAttribute is unexpectedly an array:', populatedAttribute);
              } else {
                populatedAttribute.name = populatedAttribute.name?.trim();
                populatedAttribute.values = populatedAttribute.values?.map((v: any) => ({ ...v, label: v.label?.trim() }));
                attrEntry.attribute = populatedAttribute; // Populate it in place
              }
            }
            attrEntry.value = attrEntry.value?.trim(); // Trim value here
            return attrEntry;
        }
        // Case 3: attrEntry.attribute is a string ID directly
        else if (typeof attrEntry.attribute === 'string' && mongoose.Types.ObjectId.isValid(attrEntry.attribute)) {
            console.log('DEBUG: Matched Case 3 (attribute is string ID). attrEntry.attribute:', attrEntry.attribute); // Added
            const populatedAttribute = await Attribute.findById(attrEntry.attribute).select('name values').lean();
            if (populatedAttribute) {
              // Trim attribute name and values when populating
              if (Array.isArray(populatedAttribute)) {
                console.warn('populatedAttribute is unexpectedly an array:', populatedAttribute);
              } else {
                populatedAttribute.name = populatedAttribute.name?.trim();
                populatedAttribute.values = populatedAttribute.values?.map((v: any) => ({ ...v, label: v.label?.trim() }));
                attrEntry.attribute = populatedAttribute;
              }
            }
            attrEntry.value = attrEntry.value?.trim(); // Trim value here
            return attrEntry;
        }
        // Case 4: Already in correct format or unknown structure
        else {
          // Ensure current attribute's value is trimmed
          if (attrEntry.value) {
            attrEntry.value = attrEntry.value.trim();
          }
          // Ensure populated attribute's name and values are trimmed if already populated
          if (attrEntry.attribute && typeof attrEntry.attribute === 'object' && 'name' in attrEntry.attribute) {
            attrEntry.attribute.name = attrEntry.attribute.name?.trim();
            attrEntry.attribute.values = attrEntry.attribute.values?.map((v: any) => ({ ...v, label: v.label?.trim() }));
          }
          console.log('DEBUG: Matched Case 4 (correct format or unknown). Returning as is.'); // Added
          return attrEntry;
        }
      });
      product.attributes = await Promise.all(populatedAttributesPromises);
      console.log('DEBUG: After manual attributes population. Product attributes:', product.attributes); // Added
    }

    // Deeply transform BSON types to plain JavaScript types to avoid passing Mongoose objects to client components
    const transformedProduct = JSON.parse(JSON.stringify(product));

    // Ensure variants' price, stock, and image are correctly formatted and values are trimmed
    if (transformedProduct.variants && Array.isArray(transformedProduct.variants)) {
      transformedProduct.variants = transformedProduct.variants.map((v: any) => ({
        ...v,
        price: Number(v.price) || 0, // Simplified conversion
        stock: Number(v.stock) || 0, // Simplified conversion
        image: v.image || '', // Ensure image is a string, even if null/undefined
        options: v.options.map((opt: any) => ({ // Trim variant option values
          ...opt,
          value: opt.value?.trim(),
        })),
      }));
    }

    // Ensure main product price and listPrice are correctly formatted
    transformedProduct.price = Number(transformedProduct.price) || 0; // Simplified conversion
    transformedProduct.listPrice = Number(transformedProduct.listPrice) || 0; // Simplified conversion
    transformedProduct.countInStock = Number(transformedProduct.countInStock) || 0; // Simplified conversion

    console.log('PRODUCT DEBUG (from getProductBySlug - transformed):', transformedProduct); // Log the transformed product
    if (transformedProduct.variants) {
      console.log('VARIANTS DEBUG (from getProductBySlug - transformed):', transformedProduct.variants);
    }
    return transformedProduct; // Return the transformed product
  } catch (error) {
    console.error('Error in getProductBySlug:', error);
    throw new Error('Failed to fetch product by slug');
  }
}

export async function updateProduct(data: any) {
  try {
    await connectToDatabase()
    console.log('Data received in updateProduct action:', data);
    
    const updateFields: any = {
      name: data.name,
      slug: data.slug,
      brand: data.brand,
      price: data.price,
      listPrice: data.listPrice,
      categories: data.categories,
      description: data.description,
      images: data.images,
      ficheTechnique: data.ficheTechnique,
      tags: data.tags,
      attributes: data.attributes, // Explicitly set attributes
      variants: data.variants,     // Explicitly set variants
    };

    // If updating variants, calculate total stock
    if (data.variants && Array.isArray(data.variants)) {
      const totalStock = data.variants.reduce((sum: number, variant: any) => sum + (Number(variant.stock) || 0), 0)
      updateFields.countInStock = totalStock
    } else if (data.countInStock !== undefined) { // Change from data.stock to data.countInStock
      updateFields.countInStock = Number(data.countInStock) || 0 // Change from data.stock to data.countInStock
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      data._id,
      { $set: updateFields }, // Use updateFields
      { new: true }
    )
    .populate('categories', 'name')
    .populate('attributes.attribute') // Populate attribute details
    .populate({
      path: 'variants.options.attributeId',
      model: 'Attribute',
      select: 'name' // Populate name of attribute in variant options
    });

    if (!updatedProduct) {
      return { success: false, message: 'Product not found' }
    }
    console.log('Updated product from DB in updateProduct action:', updatedProduct);

    return { success: true, product: updatedProduct }
  } catch (error) {
    console.error('Error updating product:', error)
    return { success: false, message: 'Failed to update product' }
  }
}
