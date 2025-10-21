  "use client";

  import { useEffect, useState } from "react";
  import { useUser } from "@clerk/nextjs";
  import { toast } from "sonner";
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
  } from "@/components/ui/card";
  import { Badge } from "@/components/ui/badge";
  import { Button } from "@/components/ui/button";
  import {
    Loader2,
    AlertTriangle,
    Users,
    ListChecks,
    ShoppingBasket,
    Eye,
    Search
  } from "@/utils/icons";
  import { Input } from "@/components/ui/input";
  import { useUserRole } from "@/lib/store/userStore";
  import AppPieChart from "@/components/ui/AppPieChart";
  import AppBarChart from "@/components/ui/AppBarChart";

  export default function AdminDashboard() {
    const { user, isLoaded, isSignedIn } = useUser();
    const role = useUserRole();
    const [users, setUsers] = useState([]);
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState({
      totalUsers: 0,
      farmers: 0,
      pendingRequests: 0,
      activeListings: 0
    });
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [loadingStats, setLoadingStats] = useState(true);
    const [activeTab, setActiveTab] = useState("dashboard");
    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState(null);

    useEffect(() => {
      if (isLoaded && isSignedIn && role === "admin") {
        fetchUsers();
        fetchRequests();
        fetchStats();
      }
    }, [isLoaded, isSignedIn, role]);

    const fetchUsers = async () => {
      setError(null);
      try {
        const res = await fetch("/api/get-all-users", {
          headers: { "Cache-Control": "no-cache" },
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error("API Response Error:", errorText);
          throw new Error(`${res.status}: ${res.statusText || "Erreur serveur"}`);
        }

        const data = await res.json();
        setUsers(data.users || []);
      } catch (err) {
        console.error("Erreur chargement users:", err);
        setError(err.message);
        toast.error("Erreur de chargement des utilisateurs: " + err.message);
      } finally {
        setLoadingUsers(false);
      }
    };

    const fetchRequests = async () => {
      setError(null);
      try {
        const res = await fetch("/api/get-farmer-requests", {
          headers: { "Cache-Control": "no-cache" },
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error("API Response Error:", errorText);
          throw new Error(`${res.status}: ${res.statusText || "Erreur serveur"}`);
        }

        const data = await res.json();
        setRequests(data.requests || []);
      } catch (err) {
        console.error("Erreur chargement requests:", err);
        setError(err.message);
        toast.error("Impossible de charger les demandes: " + err.message);
      } finally {
        setLoadingRequests(false);
      }
    };

    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const [listingsRes] = await Promise.all([fetch("/api/get-listings")]);

        const listingsData = await listingsRes.json();
        const activeCount = listingsData?.listings?.length || 0;

        setStats({
          totalUsers: users.length,
          farmers: users.filter((u) => u.role === "farmer").length,
          pendingRequests: requests.filter((r) => r.status === "pending").length,
          activeListings: activeCount,
        });
      } catch (err) {
        console.error("Erreur chargement stats:", err);
        toast.error("Impossible de charger les statistiques");
      } finally {
        setLoadingStats(false);
      }
    };
    

    // Met à jour les statistiques quand les données sont chargées
    useEffect(() => {
      if (!loadingUsers && !loadingRequests) {
        setStats(prev => ({
          ...prev,
          totalUsers: users.length,
          farmers: users.filter(u => u.role === "farmer").length,
          pendingRequests: requests.filter(r => r.status === "pending").length
        }));
      }
    }, [loadingUsers, loadingRequests, users, requests]);

    const handleAction = async (id, userId, role, status) => {
      try {
        const res = await fetch("/api/validate-farmer-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId: id, userId, role, status })
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error("API Validation Error:", errorText);
          throw new Error("Erreur de validation: " + res.statusText);
        }

        toast.success(status === "approved" ? "Producteur approuvé" : "Demande rejetée");

        await fetchRequests();
        await fetchUsers();
        await fetchStats();

        if (status === "approved") {
          setActiveTab("users");
        }
      } catch (err) {
        console.error("Erreur action:", err);
        toast.error("Action impossible: " + err.message);
      }
    };

    const handleApproveFarmer = async (userId) => {
      try {
        const res = await fetch("/api/update-user-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, role: "farmer" })
        });

        if (!res.ok) throw new Error("Erreur lors de l'approbation du producteur.");
        await fetchUsers();
        toast.success("Rôle mis à jour avec succès.");
      } catch (error) {
        console.error("handleApproveFarmer:", error);
        toast.error("Erreur lors de la mise à jour du rôle");
      }
    };

    const renderLoading = () => (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        <span className="ml-2 text-gray-600">Chargement...</span>
      </div>
    );

    const renderError = (message) => (
      <div className="text-center py-10">
        <div className="flex items-center justify-center mb-4">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
        </div>
        <p className="text-red-600 mb-2">{message}</p>
        <Button
          onClick={() => {
            if (activeTab === "requests") fetchRequests();
            else if (activeTab === "users") fetchUsers();
            else fetchStats();
          }}
          className="mt-4"
        >
          Réessayer
        </Button>
      </div>
    );

    const renderEmpty = (message) => (
      <div className="text-center py-10 text-gray-500">{message}</div>
    );

    // Fonction de filtrage
    const filteredUsers = searchTerm 
      ? users.filter(user => 
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.role && user.role.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      : users;

    const filteredRequests = searchTerm
      ? requests.filter(req => 
          req.farm_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.location.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : requests;

    // Si l'utilisateur n'est pas admin, afficher un message approprié
    if (isLoaded && (!isSignedIn || role !== "admin")) {
      return (
        <div className="container mx-auto py-8 px-4">
          <Card className="border-t-4 border-t-amber-600">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-amber-700">
                Accès restreint
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center py-10 text-gray-600">
                Vous devez être connecté avec un compte administrateur pour
                accéder à cette page.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="border-t-4 border-t-green-600">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-green-700">
              Tableau de bord Administrateur
            </CardTitle>
            <CardDescription>
              Gérez votre plateforme Farm to Fork
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger
                  value="dashboard"
                  className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
                >
                  Tableau de bord
                </TabsTrigger>
                <TabsTrigger
                  value="requests"
                  className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
                >
                  Demandes de producteurs
                  {stats.pendingRequests > 0 && (
                    <Badge className="ml-2 bg-green-600" variant="secondary">
                      {stats.pendingRequests}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="users"
                  className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
                >
                  Utilisateurs
                </TabsTrigger>
              </TabsList>

              {/* Tableau de bord principal */}
              <TabsContent value="dashboard">
                {loadingStats ? (
                  renderLoading()
                ) : error ? (
                  renderError(error)
                ) : (
                  <>
                    {/* Cartes de statistiques */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-gray-500 text-sm">
                                Utilisateurs
                              </p>
                              <h3 className="text-2xl font-bold">
                                {stats.totalUsers}
                              </h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-gray-500 text-sm">
                                Producteurs
                              </p>
                              <h3 className="text-2xl font-bold">
                                {stats.farmers}
                              </h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                              <ListChecks className="h-5 w-5 text-green-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-gray-500 text-sm">Demandes</p>
                              <h3 className="text-2xl font-bold">
                                {stats.pendingRequests}
                              </h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                              <ShoppingBasket className="h-5 w-5 text-yellow-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-gray-500 text-sm">
                                Fermes actives
                              </p>
                              <h3 className="text-2xl font-bold">
                                {stats.activeListings}
                              </h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <Eye className="h-5 w-5 text-purple-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Graphiques */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Répartition des utilisateurs</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                          <AppPieChart />
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>Activité récente</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                          <AppBarChart />
                        </CardContent>
                      </Card>
                    </div>

                    {/* Dernières demandes */}
                    <Card>
                      <CardHeader className="flex flex-row justify-between items-center">
                        <CardTitle>Dernières demandes</CardTitle>
                        <Button
                          variant="outline"
                          onClick={() => setActiveTab("requests")}
                        >
                          Voir tout
                        </Button>
                      </CardHeader>
                      <CardContent>
                        {requests.length === 0 ? (
                          renderEmpty("Aucune demande en attente.")
                        ) : (
                          <div className="rounded-md border overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Ferme</TableHead>
                                  <TableHead>Email</TableHead>
                                  <TableHead>Localisation</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              {/* Demandes de producteurs */}
              <TabsContent value="requests">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-700">
                    Demandes de statut producteur
                  </h2>
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {loadingRequests ? (
                  renderLoading()
                ) : error ? (
                  renderError(error)
                ) : filteredRequests.length === 0 ? (
                  renderEmpty(
                    searchTerm
                      ? "Aucun résultat pour cette recherche."
                      : "Aucune demande en attente."
                  )
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ferme</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Localisation</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRequests.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">
                              {r.farm_name}
                            </TableCell>
                            <TableCell>{r.email}</TableCell>
                            <TableCell>{r.location}</TableCell>
                            <TableCell className="max-w-xs truncate">
                              {r.description}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  r.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : r.status === "approved"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                }
                              >
                                {r.status === "pending"
                                  ? "En attente"
                                  : r.status === "approved"
                                    ? "Approuvé"
                                    : "Rejeté"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {r.status === "pending" && (
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleAction(
                                        r.id,
                                        r.user_id,
                                        "farmer",
                                        "approved"
                                      )
                                    }
                                    variant="default"
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Approuver
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleAction(
                                        r.id,
                                        r.user_id,
                                        "user",
                                        "rejected"
                                      )
                                    }
                                    variant="outline"
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                  >
                                    Rejeter
                                  </Button>
                                </div>
                              )}
                              {r.status !== "pending" && (
                                <span className="text-sm text-gray-500">
                                  Traité
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* Utilisateurs */}
              <TabsContent value="users">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-700">
                    Gestion des utilisateurs
                  </h2>
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {loadingUsers ? (
                  renderLoading()
                ) : error ? (
                  renderError(error)
                ) : filteredUsers.length === 0 ? (
                  renderEmpty(
                    searchTerm
                      ? "Aucun résultat pour cette recherche."
                      : "Aucun utilisateur trouvé."
                  )
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Rôle</TableHead>
                          <TableHead>Date d'inscription</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user, index) => (
                          <TableRow
                            key={
                              user?.user_id ?? user?.email ?? `user-${index}`
                            }
                          >
                            <TableCell className="font-medium">
                              {user?.user_id
                                ? `${user.user_id.substring(0, 8)}...`
                                : "ID inconnu"}
                            </TableCell>
                            <TableCell>
                              {user?.email ?? "Email inconnu"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  user?.role === "admin"
                                    ? "bg-purple-100 text-purple-800"
                                    : user?.role === "farmer"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-blue-100 text-blue-800"
                                }
                              >
                                {user?.role === "admin"
                                  ? "Admin"
                                  : user?.role === "farmer"
                                    ? "Producteur"
                                    : "Utilisateur"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {user?.created_at
                                ? new Date(user.created_at).toLocaleDateString(
                                    "fr-FR"
                                  )
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                >
                                  Voir détails
                                </Button>
                                {user?.role !== "admin" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                  >
                                    Suspendre
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <div className="text-sm text-gray-500">
              Dernière synchronisation: {new Date().toLocaleString()}
            </div>
            <Button
              variant="outline"
              onClick={() => {
                fetchUsers();
                fetchRequests();
                fetchStats();
                toast.success("Données rafraîchies");
              }}
            >
              Rafraîchir les données
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }