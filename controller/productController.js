const Product = require('../model/productModel');
const Category = require('../model/categoryModel');

const productListLoad = async (req, res) => {
    try {
        const PAGE_PRODUCT = 12;
        const { product, page ,category} = req.query;
        const pageNumber = parseInt(page) || 1;
        const categoryData = await Category.find()
        let query = {
            productName: { $regex: product || '', $options: 'i' }
        };
        if (category) {
            query.category_id = category;
        }
        const totalProduct = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProduct / PAGE_PRODUCT);
        const Products = await Product.find(query)
            .skip((pageNumber - 1) * PAGE_PRODUCT)
            .limit(PAGE_PRODUCT).sort({_id:-1});
        if (!Products) {
            return res.status(400).send("Product Not Found")
        } else {
            return res.status(200).render('productList', { product: Products, totalPages, currentPage: pageNumber, categoryData });
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Internal Server Error');
    }
}
const addProductPage = async (req, res) => {
    try {
        const categoryData = await Category.find({});
        if (!categoryData) {
            return res.status(400).send("Category Not Found")
        } else {
            return res.status(200).render('addproduct', { cat: categoryData });
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Internal Server Error');
    }

}
const addProduct = async (req, res) => {
    try {
        const categoryId = await Category.findOne({ categoryName: req.body.select });
        if (!categoryId) {
            return res.status(404).send('Category not found'); // Respond with a 404 status if category is not found
        } else {
            const { productName, brandName, discription, orginalPrice, salePrice, stock } = req.body
            const newProduct = new Product({
                productName, brand: brandName, discription, category_id: categoryId._id, orginalPrice, salePrice, image: req.files, stock
            })
            const productData = await newProduct.save();
            if (!productData) {
                return res.status(404).send('Product not found'); // Respond with a 404 status if product is not found
            } else {
                return res.status(200).redirect('/admin/addproduct');
            }
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Internal Server Error');
    }
}
const editProductPage = async (req, res) => {
    try {
        const id = req.query.id;
        const productData = await Product.findById({ _id: id });
        if (!productData) {
            return res.status(404).send('Product not found'); // Respond with a 404 status if product is not found
        } else {
            const categoryData = await Category.find({});
            if (!categoryData) {
                return res.status(404).send('Category not found');
            } else {
                return res.status(200).render('editproduct', { product: productData, cat: categoryData })
            }
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}
const editProduct = async (req, res) => {
    try {
        const { id, productName, brandName, discription, orginalPrice, salePrice, stock } = req.body
        const editProductDta = await Product.findByIdAndUpdate({ _id: id }, {
            $set: { productName, brand: brandName, discription, orginalPrice, salePrice, stock }
        });
        const addImage = await Product.findByIdAndUpdate({ _id: id }, { $push: { image: req.files } })
        return res.status(200).redirect('/admin/productList');
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');

    }
}
const deleteProductImage = async (req, res) => {
    try {
        const productId = req.params.productId;
        const productImg = req.params.productImg;
        const productData = await Product.updateOne({ _id: productId }, { $pull: { image: { filename: productImg } } })
        if (!productData) {
            return res.status(404).send('ProductData not updated'); // Respond with a 404 status if product is not found
        } else {
            return res.status(200).json({ success: true, message: "product Image were deleted" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }
}
const blockProduct = async (req, res) => {
    try {
        const id = req.params.productId;
        const productData = await Product.updateOne({ _id: id },
            {
                $set: {
                    is_blocked: true
                }
            });
        if (!productData) {
            return res.status(400).json({ success: false, message: "product not updated" });
        } else {
            return res.status(200).json({ success: true, message: "product updated" });
        }
    } catch (error) {
        return res.status(500).send('Internal Server Error');
    }
}
const unBlockProduct = async (req, res) => {
    try {
        const id = req.params.productId;
        const productData = await Product.updateOne({ _id: id },
            {
                $set: {
                    is_blocked: false
                }
            });
        if (!productData) {
            return res.status(400).json({ success: false, message: "product not updated" });
        } else {
            return res.status(200).json({ success: true, message: "product updated" });
        }
    } catch (error) {
        return res.status(500).send('Internal Server Error');
    }
}
const productShop = async (req, res) => {
    try {
        const loggedIn = req.session.user ? true : false;
        const id = req.query.id;
        const productData = await Product.findOne({ _id: id });
        


        const categoryData = await Category.find({ is_unList: false });
        const categoryIds = categoryData.map(category => category._id);
        const relatedProduct = await Product.find({ category_id: { $in: categoryIds } });
        return res.status(200).render('singleProductDetials', { product: productData, productData: relatedProduct, cat: categoryData, loggedIn })
    } catch (error) {
        console.error(error.message);
        return res.status(500).send('Internal Server Error');
    }
}
const Shop = async (req, res) => {
    try {
        const PAGE_PRODUCT = 12;
        const loggedIn = req.session.user ? true : false;
        const { product, page, category,price,start,end} = req.query;
        const pageNumber = parseInt(page) || 1;
        const categoryData = await Category.find({ is_unList: false });
        const categoryIds = categoryData.map(category => category._id);
        let query = {
          is_blocked: false,
        };
        query.category_id = { $in: categoryIds }
        if (product) {
          query.productName = { $regex: product, $options: 'i' };
        }
        if (category) {
          query.category_id = category;
        }
        let sortQuary={ _id: -1 }
        if(price=='high'){
            sortQuary={salePrice:-1}
        }
        if(price=='low'){
            sortQuary={salePrice:1}
        }
        if(start){
            const startPrice = Number(start.replace('₹', ''))
            const endPrice=Number(end.replace('₹', ''))
            query.salePrice = {$gte: startPrice, $lte: endPrice } 
        }
        const totalProduct = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProduct / PAGE_PRODUCT);
        const productData = await Product.find(query)
          .skip((pageNumber - 1) * PAGE_PRODUCT)
          .limit(PAGE_PRODUCT)
          .sort(sortQuary);
          return res.status(200).render("productShop", { loggedIn, product: productData, categoryData, totalPages, currentPage: pageNumber,totalProduct,price });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}
module.exports = {
    productListLoad,
    addProductPage,
    addProduct,
    editProductPage,
    editProduct,
    deleteProductImage,
    blockProduct,
    unBlockProduct,
    productShop,
    Shop
}
