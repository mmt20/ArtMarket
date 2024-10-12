// import ProductImageUpload from "@/components/admin-view/image-upload";
// import { Button } from "@/components/ui/button";
// import { addFeatureImage, getFeatureImages } from "@/store/common-slice";
// import { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
import { useSelector } from "react-redux";

import SalesChart from "@/components/admin-view/SalesChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { CircleDollarSign, ShoppingBag, UserRound } from "lucide-react";
// const initialFormData = {
//   image: null,
//   title: "",
//   description: "",
//   category: "",
//   brand: "",
//   price: 0.0,
//   salePrice: 0,
//   totalStock: 0,
//   averageReview: 0,
// };

function AdminDashboard() {
  // const [formData, setFormData] = useState(initialFormData);
  
  // const [imageFile, setImageFile] = useState(null);
  // const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  // const [imageLoadingState, setImageLoadingState] = useState(false);
  // const dispatch = useDispatch();
  // const { featureImageList } = useSelector((state) => state.commonFeature);
  const { orderList } = useSelector((state) => state.adminOrder);
  const { productList } = useSelector((state) => state.adminProducts);
  
  const totalRevenue  = orderList.length
  const totalOrders   = orderList.length
  
  const getSalesPerMonth = async () => {
    
    
    const salesPerMonth = orderList.reduce((acc, order) => {
      const monthIndex = new Date(order.createdAt).getMonth(); // 0 for Janruary --> 11 for December
      acc[monthIndex] = (acc[monthIndex] || 0) + order.totalAmount;
      // For June
      // acc[5] = (acc[5] || 0) + order.totalAmount (orders have monthIndex 5)
      return acc
    }, {})
  
    const graphData = Array.from({ length: 12}, (_, i) => {
      const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(0, i))
      // if i === 5 => month = "Jun"
      return { name: month, sales: salesPerMonth[i] || 0 }
    })
    
    return graphData
  }
  const totalCustomers    = productList.length
  const graphData = getSalesPerMonth

  // console.log(uploadedImageUrl, "uploadedImageUrl");

  // function handleUploadFeatureImage() {
  //   dispatch(addFeatureImage(uploadedImageUrl)).then((data) => {
  //     if (data?.payload?.success) {
  //       dispatch(getFeatureImages());
  //       setImageFile(null);
  //       setUploadedImageUrl("");
  //     }
  //   });
  // }
  // function setUploadedImageToFormData(imageUrl) {
  //   setFormData((prevFormData) => ({
  //     ...prevFormData,
  //     image: imageUrl,  // Update the image field in formData
  //   }));
  // }

  // useEffect(() => {
  //   dispatch(getFeatureImages());
  // }, [dispatch]);

  // console.log(featureImageList, "featureImageList");

  return (
    <div className="px-8 py-10">
      <p className="text-heading2-bold">Dashboard</p>
      <Separator className="bg-grey-1 my-5" />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-10">
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Total Revenue</CardTitle>
            <CircleDollarSign className="max-sm:hidden" />
          </CardHeader>
          <CardContent>
            <p className="text-body-bold">$ {totalRevenue}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Total Orders</CardTitle>
            <ShoppingBag className="max-sm:hidden" />
          </CardHeader>
          <CardContent>
            <p className="text-body-bold">{totalOrders}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Total Customer</CardTitle>
            <UserRound className="max-sm:hidden" />
          </CardHeader>
          <CardContent>
            <p className="text-body-bold">{totalCustomers}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-10">
        <CardHeader>
          <CardTitle>Sales Chart ($)</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesChart data={graphData} />
        </CardContent>
      </Card>
    </div>
  );

  // return (
  //   <div>
  //     <ProductImageUpload
  //       imageFile={imageFile}
  //       setImageFile={setImageFile}
  //       uploadedImageUrl={uploadedImageUrl}
  //       setUploadedImageUrl={setUploadedImageUrl}
  //       setImageLoadingState={setImageLoadingState}
  //       imageLoadingState={imageLoadingState}
  //       isCustomStyling={true}
  //       setUploadedImageToFormData={setUploadedImageToFormData}

  //       // isEditMode={currentEditedId !== null}
  //     />
  //     <Button onClick={handleUploadFeatureImage} className="mt-5 w-full">
  //       Upload
  //     </Button>
  //     <div className="flex flex-col gap-4 mt-5">
  //       {featureImageList && featureImageList.length > 0
  //         ? featureImageList.map((featureImgItem, index) => (
  //             <div className="relative" key={index}>
  //               <img
  //                 src={featureImgItem.image}
  //                 className="w-full h-[300px] object-cover rounded-t-lg"
  //               />
  //             </div>
  //           ))
  //         : null}
  //     </div>
  //   </div>
  // );
}

export default AdminDashboard;
