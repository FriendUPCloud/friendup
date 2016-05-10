
#include <stdio.h>
#include <stdlib.h>


void preKmp(char *x, int m, int kmpNext[]) {
   int i, j;

   i = 0;
   j = kmpNext[0] = -1;
   while (i < m) {
      while (j > -1 && x[i] != x[j])
         j = kmpNext[j];
      i++;
      j++;
      if (x[i] == x[j])
         kmpNext[i] = kmpNext[j];
      else
         kmpNext[i] = j;
   }
}


void KMP(char *x, int m, char *y, int n) {
   //int i, j, kmpNext[XSIZE];
   int i, j, kmpNext[ m ];

   /* Preprocessing */
   preKmp(x, m, kmpNext);

   /* Searching */
   i = j = 0;
   while (j < n) {
      while (i > -1 && x[i] != y[j])
         i = kmpNext[i];
      i++;
      j++;
      if (i >= m) {
         //OUTPUT(j - i);
         printf("%d", j-i );
         i = kmpNext[i];
      }
   }
}

int main( int argc, char **argv )
{
   char *text = "grtgrtg34r4tgrtgrtgeg54tg54t54tgtrgrtALAr43r34vfgvrt56uh76";
   char *find = "ALA";
   
   KMP( find, 3, text, strlen( text ) );

	return 0;
}


