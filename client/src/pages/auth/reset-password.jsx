// import { useState } from "react";
// import { useDispatch } from "react-redux";
// import { useToast } from "@/components/ui/use-toast";
// import { resetPasswordFormControls } from "@/config"; // Assuming form controls exist
// import { resetPassword } from "@/store/auth-slice"; // Redux actions
// import { Link } from "react-router-dom";
// import { InputOTPForm } from "@/components/common/InputOTPForm"; // Adjust import path
// import CommonForm from "@/components/common/form";

// const initialState = {
//   email: "",
//   otp: "",
//   password: "",
//   confirmPassword: ""
// };

// function ResetPassword() {
//   const [formData, setFormData] = useState(initialState);
//   const [otpVerified, setOtpVerified] = useState(false); // Tracks if OTP is verified
//   const dispatch = useDispatch();
//   const { toast } = useToast();

//   // Handle OTP verification
//   const handleOTPSubmit = (otp) => {
//     const formWithOtp = { ...formData, otp };

//     // dispatch(verifyOTP(formWithOtp)).then((data) => {
//     //   if (data?.payload?.success) {
//     //     toast({
//     //       title: "OTP Verified. Please enter your new password.",
//     //     });
//     //     setOtpVerified(true); // OTP is correct, switch to password form
//     //   } else {
//     //     toast({
//     //       title: "Invalid OTP. Please try again.",
//     //       variant: "destructive",
//     //     });
//     //   }
//     // });
//   };

//   // Handle new password submission
//   const handlePasswordSubmit = (event) => {
//     event.preventDefault();

//     if (formData.password !== formData.confirmPassword) {
//       toast({
//         title: "Passwords do not match!",
//         variant: "destructive",
//       });
//       return;
//     }

//     // dispatch(updatePassword(formData)).then((data) => {
//     //   if (data?.payload?.success) {
//     //     toast({
//     //       title: "Password updated successfully.",
//     //     });
//     //   } else {
//     //     toast({
//     //       title: "Failed to update password.",
//     //       variant: "destructive",
//     //     });
//     //   }
//     // });
//   };

//   return (
//     <div className="mx-auto w-full max-w-md space-y-6">
//       <div className="text-center">
//         <h1 className="text-3xl font-bold tracking-tight text-foreground">
//           {otpVerified ? "Update Your Password" : "Verify OTP"}
//         </h1>
//         <p className="mt-2">
//           Don't have an account?
//           <Link
//             className="font-medium ml-2 text-primary hover:underline"
//             to="/auth/register"
//           >
//             Register
//           </Link>
//         </p>
//       </div>

//       {/* Render OTP form or password form based on `otpVerified` */}
//       {!otpVerified ? (
//         <form onSubmit={handlePasswordSubmit} className="space-y-6">
//           <CommonForm
//             formControls={otpFormControls}
//             buttonText={"OTP Verification"}
//             formData={formData}
//             setFormData={setFormData}
//             onSubmit={handlePasswordSubmit}
//           />
//       </form>
//       ) : (
//         <form onSubmit={handlePasswordSubmit} className="space-y-6">
//           {/* Update password form */}
//           <CommonForm
//             formControls={resetPasswordFormControls}
//             buttonText={"Update Password"}
//             formData={formData}
//             setFormData={setFormData}
//             onSubmit={handlePasswordSubmit}
//           />
//         </form>
//       )}
//     </div>
//   );
// }

// export default ResetPassword;

import CommonForm from "@/components/common/form";
import { useToast } from "@/components/ui/use-toast";
import { resetPasswordFormControls, otpFormControls } from "@/config"; // Assuming `otpFormControls` exists
import { resetPassword ,verifyOTP } from "@/store/auth-slice"; // Assuming you have actions for verifying OTP and updating the password
import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";

const initialState = {
  email: "",
  otp: "",
  newPassword: "",
  confirmPassword: ""
};

function ResetPassword() {
  const [formData, setFormData] = useState(initialState);
  const [otpVerified, setOtpVerified] = useState(false); // Tracks if OTP is verified
  const dispatch = useDispatch();
  const { toast } = useToast();

  // OTP verification form submission
  function onOTPSubmit(event) {
    event.preventDefault();

    dispatch(verifyOTP(formData)).then((data) => {
      if (data?.payload?.success) {
        toast({
          title: "OTP Verified. Please enter your new password.",
        });
        setOtpVerified(true); // OTP is correct, switch to password form
      } else {
        toast({
          title: "Invalid OTP. Please try again.",
          variant: "destructive",
        });
      }
    });
  }

  // New password form submission
  function onPasswordSubmit(event) {
    event.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Passwords do not match!",
        variant: "destructive",
      });
      return;
    }

    dispatch(updatePassword(formData)).then((data) => {
      if (data?.payload?.success) {
        toast({
          title: "Password updated successfully.",
        });
      } else {
        toast({
          title: "Failed to update password.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {otpVerified ? "Update Your Password" : "Verify OTP"}
        </h1>
        <p className="mt-2">
          Don't have an account?
          <Link
            className="font-medium ml-2 text-primary hover:underline"
            to="/auth/register"
          >
            Register
          </Link>
        </p>
      </div>

      {/* Conditional rendering based on whether OTP is verified */}
      {!otpVerified ? (
        <CommonForm
          formControls={otpFormControls} // Form to handle OTP input
          buttonText={"Verify OTP"}
          formData={formData}
          setFormData={setFormData}
          onSubmit={onOTPSubmit}
        />
      ) : (
        <CommonForm
          formControls={resetPasswordFormControls} // Form to handle new password
          buttonText={"Update Password"}
          formData={formData}
          setFormData={setFormData}
          onSubmit={onPasswordSubmit}
        />
      )}
    </div>
  );
}

export default ResetPassword;
