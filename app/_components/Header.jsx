"use client";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { CircleUserIcon, LogIn, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCoordinates } from "../contexts/CoordinateContext";
import GoogleAddressSearchForHeader from "./GoogleAddressSearchForHeader";

function Header() {
  const path = usePathname();
  const { user, isSignedIn } = useUser();
  const { coordinates, setCoordinates } = useCoordinates();

  return (
    <header className="sticky top-0 z-50 grid grid-cols-3 md:grid-cols-[1fr_2fr_1fr] items-center bg-white shadow-md p-3 sm:p-5 md:px-10 lg:px-16">
      {/* left */}
      <div className="relative flex items-center h-10 col-span-1">
        <Link href="/" className="cursor-pointer">
          <Image
            src="/logo.svg"
            className="w-[120px] sm:w-[150px] md:w-[180px] h-auto"
            style={{
              objectFit: "contain",
              objectPosition: "left",
            }}
            width={180}
            height={100}
            alt="logo"
            priority
          />
        </Link>
      </div>

      {/*Middle*/}
      <div>
        <GoogleAddressSearchForHeader
          selectedAddress={(v) => {
            setCoordinates({
              lat: v?.value?.geometry?.location?.lat() || 0,
              lng: v?.value?.geometry?.location?.lng() || 0,
            });
          }}
          setParentCoordinates={setCoordinates}
        />
      </div>

      {/* right */}
      <div className="flex items-center justify-end text-gray-400 gap-2 sm:gap-4 text-primary">
        <Link className="hidden lg:inline" href="add-new-listing">
          <Plus className="h-4 w-4 md:h-5 md:w-5 inline-flex" /> Register your
          Farm
        </Link>

        <Link
          className="lg:hidden rounded-lg border-2 p-1.5 sm:p-2.5 text-primary transition hover:text-teal-600/75"
          href="add-new-listing"
        >
          <Plus className="h-4 w-4 md:h-5 md:w-5" />
        </Link>

        {isSignedIn ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Image
                src={user?.imageUrl}
                width={40}
                height={40}
                alt="user profile"
                className="rounded-full cursor-pointer"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/user">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/user/my-listing">My Listing</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <SignOutButton>Logout</SignOutButton>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            className="flex items-center gap-1 md:gap-2 border-2 p-1.5 sm:p-2.5 rounded-lg text-primary"
            href="/sign-in"
          >
            <LogIn className="h-4 w-4 md:h-5 md:w-5" />
            <CircleUserIcon className="h-4 w-4 md:h-5 md:w-5" />
          </Link>
        )}
      </div>
    </header>
  );
}

export default Header;
