import React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BathIcon, BedDouble } from 'lucide-react';


function FilterSection() {
  return (
    <div className="px-2 py-2 grid grid-cols-2 md:grid-cols-3 gap-2">
      <Select>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Products" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">
            <h2 className="flex gap-2">
              {" "}
              <BedDouble className="h-5 w-5 text-primary" /> Légumes
            </h2>
          </SelectItem>
          <SelectItem value="2">
            <h2 className="flex gap-2">
              {" "}
              <BedDouble className="h-5 w-5 text-primary" /> Viande
            </h2>
          </SelectItem>
          <SelectItem value="3">
            <h2 className="flex gap-2">
              {" "}
              <BedDouble className="h-5 w-5 text-primary" /> Fruit
            </h2>
          </SelectItem>
        </SelectContent>
      </Select>

      <Select>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="TypeSell" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">
            <h2 className="flex gap-2">
              {" "}
              <BathIcon className="h-5 w-5 text-primary" /> Drive
            </h2>
          </SelectItem>
          <SelectItem value="2">
            <h2 className="flex gap-2">
              {" "}
              <BathIcon className="h-5 w-5 text-primary" /> Delivery
            </h2>
          </SelectItem>
        </SelectContent>
      </Select>

      <Select>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="SellType" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">
            <h2 className="flex gap-2">
              {" "}
              <BathIcon className="h-5 w-5 text-primary" /> Drive
            </h2>
          </SelectItem>
          <SelectItem value="2">
            <h2 className="flex gap-2">
              {" "}
              <BathIcon className="h-5 w-5 text-primary" /> Delivery
            </h2>
          </SelectItem>
        </SelectContent>
      </Select>

    </div>
  );
}

export default FilterSection