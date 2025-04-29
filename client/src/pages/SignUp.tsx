// c:\Users\admin\Downloads\RealEstateSync\client\src\pages\SignUp.tsx

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { insertUserSchema } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext"; // Import useLanguage

// Schema remains the same, already restricts role to 'user' or 'agent'
const signUpSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"), // Add password here
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  role: z.enum(["user", "agent"], {
    required_error: "You need to select an account type.",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // Apply error to confirmPassword field
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUp() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage(); // Get translation function

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      name: "",
      phone: "",
      role: "user", // Default role to 'user'
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: SignUpFormValues) => {
      // Exclude confirmPassword before sending to API
      const { confirmPassword, ...signUpData } = data;
      console.log("Sending registration data:", signUpData);
      return apiRequest("POST", "/users/register", signUpData); // Correct endpoint
    },
    onSuccess: () => {
      toast({
        title: t('auth.successTitle'), // Use translation
        description: t('auth.successDesc'), // Use translation
      });
      navigate("/signin"); // Navigate to sign-in page on success
    },
    onError: (error: any) => { // Use 'any' or a more specific error type if available
      console.error("Registration error:", error);
      toast({
        title: t('auth.failTitle'), // Use translation
        // Use message from backend error response if available
        description: error?.message || "An unexpected error occurred during registration.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SignUpFormValues) => {
    mutate(data);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-heading text-center">{t('auth.signUp')}</CardTitle>
              <CardDescription className="text-center">
                {t('auth.signUpHeading')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Role Selection */}
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>{t('auth.roleLabel')}</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                            disabled={isPending} // Disable during submit
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="user" disabled={isPending} />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {t('auth.roleUser')}
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="agent" disabled={isPending} />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {t('auth.roleAgent')}
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('auth.nameLabel')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('auth.namePlaceholder')} {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('auth.emailLabel')}</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder={t('auth.emailPlaceholder')} {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('auth.phoneLabel')}</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder={t('auth.phonePlaceholder')}
                            {...field}
                            value={field.value || ""}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />


                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('auth.usernameLabel')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('auth.usernamePlaceholder')} {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('auth.passwordLabel')}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder={t('auth.passwordPlaceholder')} {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('auth.confirmPasswordLabel')}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder={t('auth.confirmPasswordPlaceholder')} {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? (
                      <>
                        <i className="ri-loader-4-line animate-spin mr-2"></i>
                        {t('auth.loading')}
                      </>
                    ) : t('auth.submitSignUp')}
                  </Button>
                </form>
              </Form>

              <div className="mt-4 text-center text-sm">
                <p className="text-slate-600">
                  {t('auth.haveAccount')} <span> </span>
                  <Link href="/signin">
                    <span className="text-primary-600 hover:underline cursor-pointer">{t('auth.signInLink')}</span>
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
