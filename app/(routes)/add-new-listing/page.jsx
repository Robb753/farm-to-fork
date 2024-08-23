"use client"
import GoogleAddressSearch from '@/app/_components/GoogleAddressSearch';
import { Button } from '@/components/ui/button';
import { supabase } from '@/utils/supabase/client';
import { useUser } from '@clerk/nextjs';
import { Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'
import { toast } from 'sonner';

function AddNewListing() {
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const {user}=useUser();
  const [loader, setLoader]=useState(false);
  const router=useRouter();

  const nexthandler=async()=>{
    setLoader(true)
    console.log(selectedAddress, coordinates);
    
    const { data, error } = await supabase
      .from('listing')
      .insert([
        { address: selectedAddress.label, 
          coordinates: coordinates, 
          createdBy: user?.primaryEmailAddress.emailAddress },
      ])
      .select()

      if(data){
        setLoader(false)
        console.log("New data added", data);
        toast("New Address added for listing");
        router.replace('/edit-listing/'+data[0].id);
      }
      if(error){
        setLoader(false)
        console.log("error");
        toast("Server error")
      }
  }
  return (
    <div className="mt-10 md:mx-56 lg:mx-80">
      <div
        className="p-10 flex flex-col
       gap-5 items-center justify-center"
      >
        <h2 className="font-bold text-2xl">Add New Listing</h2>
        <div className="p-10 rounded-lg shadow-lg flex flex-col gap-5 w-full">
          <h2 className="text-center text-gray-500 ">
            Enter Address which you want to list
          </h2>
          <GoogleAddressSearch
            selectedAddress={(value) => setSelectedAddress(value)}
            setCoordinates={(value) => setCoordinates(value)}
          />
          <Button 
          disabled={!selectedAddress|| !coordinates|| loader}
          onClick={nexthandler}
          >
            {loader?<Loader className='animate-spin'/>:'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}
export default AddNewListing;