"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Globe, Mail, MapPin, Phone } from "@/utils/icons"
export default function ContactCard({ listing }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-green-700">
          <Phone className="h-5 w-5 mr-2" />
          Contact
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {listing?.address && (
          <div className="flex items-start space-x-3">
            <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
            <div>
              <p className="font-medium">Adresse</p>
              <p className="text-sm text-muted-foreground">{listing.address}</p>
            </div>
          </div>
        )}

        {listing?.phoneNumber && (
          <>
            <Separator />
            <div className="flex items-center space-x-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Téléphone</p>
                <p className="text-sm text-muted-foreground">
                  {listing.phoneNumber}
                </p>
              </div>
            </div>
          </>
        )}

        {listing?.createdBy && (
          <>
            <Separator />
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">
                  {listing.createdBy}
                </p>
              </div>
            </div>
          </>
        )}

        {listing?.website && (
          <>
            <Separator />
            <div className="flex items-center space-x-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Site web</p>
                <p className="text-sm text-muted-foreground">
                  {listing.website}
                </p>
              </div>
            </div>
          </>
        )}

        <Separator />

        <Button className="w-full bg-green-600 hover:bg-green-700">
          Nous contacter
        </Button>
      </CardContent>
    </Card>
  );
}
